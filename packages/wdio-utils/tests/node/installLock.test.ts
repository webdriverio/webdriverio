import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { withInstallLock } from '../../src/node/installLock.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const fast = { pollInterval: 10, staleAfter: 60_000, refreshInterval: 20, maxWait: 5_000 }
const exists = (file: string) => fs.access(file).then(() => true, () => false)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * a live process of this machine that is not this one
 */
const otherHolder = () => JSON.stringify({ pid: process.ppid, hostname: os.hostname(), token: 'other' })

describe('withInstallLock', () => {
    let dir: string
    let lockPath: string

    /**
     * behaves like `install()` of `@puppeteer/browsers`: it downloads only when the
     * browser is not there
     */
    let installed: boolean
    let downloads: number
    let running: number
    let maxRunning: number
    const isInstalled = async () => installed
    const download = (ms = 50) => vi.fn(async () => {
        if (installed) {
            return
        }
        downloads++
        maxRunning = Math.max(maxRunning, ++running)
        await sleep(ms)
        running--
        installed = true
    })

    const writeLock = async (content: string, ageMs = 0) => {
        await fs.mkdir(path.dirname(lockPath), { recursive: true })
        await fs.writeFile(lockPath, content)
        const time = new Date(Date.now() - ageMs)
        await fs.utimes(lockPath, time, time)
    }

    beforeEach(async () => {
        dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-install-lock-'))
        lockPath = path.join(dir, 'chromium', '1715417.lock')
        installed = false
        downloads = running = maxRunning = 0
    })

    afterEach(async () => {
        await fs.rm(dir, { recursive: true, force: true })
    })

    it('holds the lock while it installs and removes it after', async () => {
        let lockedDuringInstall = false
        await withInstallLock(lockPath, isInstalled, async () => {
            lockedDuringInstall = await exists(lockPath)
        }, fast)

        expect(lockedDuringInstall).toBe(true)
        expect(await exists(lockPath)).toBe(false)
    })

    it('returns what install returns', async () => {
        await expect(withInstallLock(lockPath, isInstalled, async () => 'done', fast)).resolves.toBe('done')
    })

    /**
     * two workers set up the same build at the same time: one downloads, the other
     * waits and then finds the browser
     */
    it('lets concurrent callers install one after the other', async () => {
        const install = download()

        await Promise.all([1, 2, 3, 4].map(() => withInstallLock(lockPath, isInstalled, install, fast)))

        expect(downloads).toBe(1)
        expect(maxRunning).toBe(1)
        expect(install).toHaveBeenCalledTimes(4)
        expect(await exists(lockPath)).toBe(false)
    })

    it('installs after the first caller failed and released the lock', async () => {
        const install = vi.fn()
            .mockImplementationOnce(async () => {
                await sleep(50)
                throw new Error('download failed')
            })
            .mockResolvedValueOnce(undefined)

        const results = await Promise.allSettled([
            withInstallLock(lockPath, isInstalled, install, fast),
            withInstallLock(lockPath, isInstalled, install, fast)
        ])

        expect(results.map((r) => r.status).sort()).toEqual(['fulfilled', 'rejected'])
        expect(install).toHaveBeenCalledTimes(2)
        expect(await exists(lockPath)).toBe(false)
    })

    /**
     * the browser is there and no process installs it: no lock, like before, so a
     * read-only cache works and workers do not wait for each other
     */
    it('installs without the lock when the browser is there and nobody holds the lock', async () => {
        installed = true
        let lockedDuringInstall = true
        await withInstallLock(lockPath, isInstalled, async () => {
            lockedDuringInstall = await exists(lockPath)
        }, fast)

        expect(lockedDuringInstall).toBe(false)
        expect(await exists(path.dirname(lockPath))).toBe(false)
    })

    /**
     * the executable of a browser can exist before the other process has finished
     * unpacking it, so only the release of the lock counts
     */
    it('waits for a holder even when the executable is already there', async () => {
        installed = true
        await writeLock(otherHolder())
        let released = false
        setTimeout(async () => {
            released = true
            await fs.rm(lockPath)
        }, 80)

        await withInstallLock(lockPath, isInstalled, async () => {
            expect(released).toBe(true)
        }, fast)
    })

    it('installs without the lock when it cannot create it', async () => {
        await fs.writeFile(path.join(dir, 'file'), '')
        const install = vi.fn()

        await withInstallLock(path.join(dir, 'file', '1715417.lock'), isInstalled, install, fast)

        expect(install).toHaveBeenCalledTimes(1)
    })

    it('removes the lock of a process of this machine that no longer runs', async () => {
        await writeLock(JSON.stringify({ pid: 2 ** 22 + 7, hostname: os.hostname(), token: 'dead' }))
        const install = vi.fn()

        await withInstallLock(lockPath, isInstalled, install, fast)

        expect(install).toHaveBeenCalledTimes(1)
        expect(await exists(lockPath)).toBe(false)
    })

    /**
     * a container that crashed during the install and runs again has the same pid
     */
    it('removes a lock with the pid of this process that this process does not hold', async () => {
        await writeLock(JSON.stringify({ pid: process.pid, hostname: os.hostname(), token: 'earlier-run' }))
        let lockedDuringInstall = false

        await withInstallLock(lockPath, isInstalled, async () => {
            lockedDuringInstall = await exists(lockPath)
        }, { ...fast, maxWait: 500 })

        expect(lockedDuringInstall).toBe(true)
        expect(await exists(lockPath)).toBe(false)
    })

    it('removes a lock that its holder has not refreshed for staleAfter', async () => {
        await writeLock(otherHolder(), 120_000)
        const install = vi.fn()

        await withInstallLock(lockPath, isInstalled, install, fast)

        expect(install).toHaveBeenCalledTimes(1)
    })

    /**
     * a cache on a network drive or a volume of several containers: the pid of another
     * machine means nothing here, only the refresh of the lock counts
     */
    it('waits for a fresh lock of another machine although its pid does not run here', async () => {
        await writeLock(JSON.stringify({ pid: 2 ** 22 + 7, hostname: 'other-machine', token: 'remote' }))
        let released = false
        setTimeout(async () => {
            released = true
            await fs.rm(lockPath)
        }, 80)

        await withInstallLock(lockPath, isInstalled, async () => {
            expect(released).toBe(true)
        }, fast)
    })

    /**
     * a download can take longer than staleAfter; the holder keeps its lock fresh
     */
    it('keeps the lock of a slow install', async () => {
        const options = { ...fast, staleAfter: 100 }
        const install = download(400)

        await Promise.all([
            withInstallLock(lockPath, isInstalled, install, options),
            sleep(20).then(() => withInstallLock(lockPath, isInstalled, install, options))
        ])

        expect(downloads).toBe(1)
        expect(maxRunning).toBe(1)
    })

    it('lets one caller at a time remove a stale lock', async () => {
        await writeLock(JSON.stringify({ pid: 2 ** 22 + 7, hostname: os.hostname(), token: 'dead' }))
        const install = download()

        await Promise.all([1, 2, 3, 4, 5, 6].map(() => withInstallLock(lockPath, isInstalled, install, { ...fast, pollInterval: 1 })))

        expect(downloads).toBe(1)
        expect(maxRunning).toBe(1)
        expect(await exists(lockPath)).toBe(false)
        expect(await exists(`${lockPath}.reap`)).toBe(false)
    })

    /**
     * a holder that stopped while it unpacked can leave the executable without the
     * rest of the browser
     */
    it('lets onStaleLock remove what the unfinished install left, once', async () => {
        installed = true
        await writeLock(JSON.stringify({ pid: 2 ** 22 + 7, hostname: os.hostname(), token: 'dead' }))
        const onStaleLock = vi.fn(async () => {
            installed = false
        })
        const install = download()

        await Promise.all([1, 2, 3].map(() => withInstallLock(lockPath, isInstalled, install, { ...fast, pollInterval: 1, onStaleLock })))

        expect(onStaleLock).toHaveBeenCalledTimes(1)
        expect(downloads).toBe(1)
    })

    it('removes a stale lock when onStaleLock fails', async () => {
        await writeLock(JSON.stringify({ pid: 2 ** 22 + 7, hostname: os.hostname(), token: 'dead' }))
        let lockedDuringInstall = false

        await withInstallLock(lockPath, isInstalled, async () => {
            lockedDuringInstall = await exists(lockPath)
        }, { ...fast, onStaleLock: () => Promise.reject(new Error('EBUSY')) })

        expect(lockedDuringInstall).toBe(true)
    })

    /**
     * the other process removes the stale lock and may take a new one: removing "the
     * stale lock" now would remove that new lock
     */
    it('does not remove a stale lock while another process removes it', async () => {
        await writeLock(JSON.stringify({ pid: 2 ** 22 + 7, hostname: os.hostname(), token: 'dead' }))
        await fs.writeFile(`${lockPath}.reap`, otherHolder())
        let removedByOther = false
        setTimeout(async () => {
            removedByOther = true
            await fs.rm(lockPath)
            await fs.rm(`${lockPath}.reap`)
        }, 80)

        await withInstallLock(lockPath, isInstalled, async () => {
            expect(removedByOther).toBe(true)
        }, fast)
    })

    it('does not remove a lock that another process took over', async () => {
        await withInstallLock(lockPath, isInstalled, async () => {
            await fs.writeFile(lockPath, otherHolder())
        }, fast)

        expect(await exists(lockPath)).toBe(true)
    })

    it('installs without the lock after maxWait', async () => {
        await writeLock(otherHolder())
        const install = vi.fn()

        await withInstallLock(lockPath, isInstalled, install, { ...fast, maxWait: 50 })

        expect(install).toHaveBeenCalledTimes(1)
        expect(await exists(lockPath)).toBe(true)
    })

    it('keeps waiting on a lock that it cannot read yet', async () => {
        await writeLock('')
        setTimeout(async () => {
            installed = true
            await fs.rm(lockPath)
        }, 50)
        const install = download()

        await withInstallLock(lockPath, isInstalled, install, fast)

        expect(downloads).toBe(0)
    })
})
