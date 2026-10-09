import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { withInstallLock } from '../../src/node/installLock.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const fast = { pollInterval: 10, staleAfter: 60_000, maxWait: 5_000 }
const exists = (file: string) => fs.access(file).then(() => true, () => false)

describe('withInstallLock', () => {
    let dir: string
    let lockPath: string

    beforeEach(async () => {
        dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-install-lock-'))
        lockPath = path.join(dir, 'chromium', '1715417.lock')
    })

    afterEach(async () => {
        await fs.rm(dir, { recursive: true, force: true })
    })

    it('holds the lock while it installs and removes it after', async () => {
        let lockedDuringInstall = false
        await withInstallLock(lockPath, async () => false, async () => {
            lockedDuringInstall = await exists(lockPath)
        }, fast)

        expect(lockedDuringInstall).toBe(true)
        expect(await exists(lockPath)).toBe(false)
    })

    /**
     * two workers set up the same build at the same time: one installs, the other
     * waits and then uses the installed browser
     */
    it('lets a second caller wait and use what the first installed', async () => {
        let installed = false
        const install = vi.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 100))
            installed = true
        })
        const isInstalled = async () => installed

        await Promise.all([
            withInstallLock(lockPath, isInstalled, install, fast),
            withInstallLock(lockPath, isInstalled, install, fast)
        ])

        expect(install).toHaveBeenCalledTimes(1)
        expect(await exists(lockPath)).toBe(false)
    })

    it('installs after the first caller failed and released the lock', async () => {
        const install = vi.fn()
            .mockImplementationOnce(async () => {
                await new Promise((resolve) => setTimeout(resolve, 50))
                throw new Error('download failed')
            })
            .mockResolvedValueOnce(undefined)

        const results = await Promise.allSettled([
            withInstallLock(lockPath, async () => false, install, fast),
            withInstallLock(lockPath, async () => false, install, fast)
        ])

        expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected'])
        expect(install).toHaveBeenCalledTimes(2)
        expect(await exists(lockPath)).toBe(false)
    })

    it('removes the lock of a process that no longer runs', async () => {
        await fs.mkdir(path.dirname(lockPath), { recursive: true })
        await fs.writeFile(lockPath, JSON.stringify({ pid: 2 ** 22 + 7, startedAt: Date.now() }))
        const install = vi.fn()

        await withInstallLock(lockPath, async () => false, install, fast)

        expect(install).toHaveBeenCalledTimes(1)
        expect(await exists(lockPath)).toBe(false)
    })

    it('removes a lock older than staleAfter', async () => {
        await fs.mkdir(path.dirname(lockPath), { recursive: true })
        await fs.writeFile(lockPath, JSON.stringify({ pid: process.pid, startedAt: Date.now() - 120_000 }))
        const install = vi.fn()

        await withInstallLock(lockPath, async () => false, install, fast)

        expect(install).toHaveBeenCalledTimes(1)
    })

    it('installs without the lock after maxWait', async () => {
        await fs.mkdir(path.dirname(lockPath), { recursive: true })
        await fs.writeFile(lockPath, JSON.stringify({ pid: process.pid, startedAt: Date.now() }))
        const install = vi.fn()

        await withInstallLock(lockPath, async () => false, install, { ...fast, maxWait: 50 })

        expect(install).toHaveBeenCalledTimes(1)
        expect(await exists(lockPath)).toBe(true)
    })

    /**
     * the executable of a browser can exist before the other process has finished
     * unpacking it, so only the release of the lock counts
     */
    it('does not use the browser while another process still holds the lock', async () => {
        await fs.mkdir(path.dirname(lockPath), { recursive: true })
        await fs.writeFile(lockPath, JSON.stringify({ pid: process.pid, startedAt: Date.now() }))
        let released = false
        setTimeout(async () => {
            released = true
            await fs.rm(lockPath)
        }, 80)

        await withInstallLock(lockPath, async () => true, vi.fn(), fast)

        expect(released).toBe(true)
    })

    it('keeps waiting on a lock that it cannot read yet', async () => {
        await fs.mkdir(path.dirname(lockPath), { recursive: true })
        await fs.writeFile(lockPath, '')
        let installed = false
        setTimeout(async () => {
            installed = true
            await fs.rm(lockPath)
        }, 50)
        const install = vi.fn()

        await withInstallLock(lockPath, async () => installed, install, fast)

        expect(install).not.toHaveBeenCalled()
    })
})
