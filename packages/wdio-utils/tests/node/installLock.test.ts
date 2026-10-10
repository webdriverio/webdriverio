import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { readlinkSync } from 'node:fs'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { withInstallLock } from '../../src/node/installLock.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const fast = { pollInterval: 10, staleAfter: 60_000, refreshInterval: 20, maxWait: 5_000 }
const exists = (file: string) => fs.access(file).then(() => true, () => false)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * the pid namespace of this process on Linux, as the lock writes it
 */
const pidns = (() => {
    try {
        return readlinkSync('/proc/self/ns/pid')
    } catch {
        return undefined
    }
})()

/**
 * the lock of a process of this machine
 */
const localLock = (content: object) => JSON.stringify({ hostname: os.hostname(), pidns, ...content })

/**
 * a live process of this machine that is not this one
 */
const otherHolder = () => localLock({ pid: process.ppid, token: 'other' })

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
        await writeLock(localLock({ pid: 2 ** 22 + 7, token: 'dead' }))
        const install = vi.fn()

        await withInstallLock(lockPath, isInstalled, install, fast)

        expect(install).toHaveBeenCalledTimes(1)
        expect(await exists(lockPath)).toBe(false)
    })

    /**
     * a container that crashed during the install and runs again has the same pid
     */
    it('removes a lock with the pid of this process that this process does not hold', async () => {
        await writeLock(localLock({ pid: process.pid, token: 'earlier-run' }))
        let lockedDuringInstall = false

        await withInstallLock(lockPath, isInstalled, async () => {
            lockedDuringInstall = await exists(lockPath)
        }, { ...fast, maxWait: 500 })

        expect(lockedDuringInstall).toBe(true)
        expect(await exists(lockPath)).toBe(false)
    })

    it('removes a lock that its holder does not refresh for staleAfter', async () => {
        await writeLock(otherHolder())
        const onStaleLock = vi.fn(async () => {})
        let lockedDuringInstall = false
        const startedAt = Date.now()

        await withInstallLock(lockPath, isInstalled, async () => {
            lockedDuringInstall = await exists(lockPath)
        }, { ...fast, staleAfter: 100, onStaleLock })

        expect(Date.now() - startedAt).toBeGreaterThanOrEqual(100)
        expect(onStaleLock).toHaveBeenCalledTimes(1)
        expect(lockedDuringInstall).toBe(true)
    })

    /**
     * the clock of the holder's machine can differ, so only the time that this process
     * watches the lock counts, not its file time
     */
    it('does not take a live lock with an old file time for stale', async () => {
        await writeLock(JSON.stringify({ pid: 2 ** 22 + 7, hostname: 'other-machine', token: 'remote' }), 120_000)
        const onStaleLock = vi.fn(async () => {})
        setTimeout(() => fs.rm(lockPath), 80)

        await withInstallLock(lockPath, isInstalled, vi.fn(), { ...fast, staleAfter: 1000, onStaleLock })

        expect(onStaleLock).not.toHaveBeenCalled()
    })

    /**
     * two containers with the same host name (e.g. `--network host`) and the same pid,
     * but their own pid namespaces
     */
    it('does not take the lock of another container with the same host name and pid for stale', async () => {
        await writeLock(JSON.stringify({ pid: process.pid, hostname: os.hostname(), pidns: 'pid:[1]', token: 'other-container' }))
        const onStaleLock = vi.fn(async () => {})
        setTimeout(() => fs.rm(lockPath), 80)

        await withInstallLock(lockPath, isInstalled, vi.fn(), { ...fast, onStaleLock })

        expect(onStaleLock).not.toHaveBeenCalled()
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
        await writeLock(localLock({ pid: 2 ** 22 + 7, token: 'dead' }))
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
        await writeLock(localLock({ pid: 2 ** 22 + 7, token: 'dead' }))
        const onStaleLock = vi.fn(async () => {
            installed = false
        })
        const install = download()

        await Promise.all([1, 2, 3].map(() => withInstallLock(lockPath, isInstalled, install, { ...fast, pollInterval: 1, onStaleLock })))

        expect(onStaleLock).toHaveBeenCalledTimes(1)
        expect(downloads).toBe(1)
    })

    it('removes a stale lock when onStaleLock fails', async () => {
        await writeLock(localLock({ pid: 2 ** 22 + 7, token: 'dead' }))
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
        await writeLock(localLock({ pid: 2 ** 22 + 7, token: 'dead' }))
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

    it('waits with its poll interval and maxWait while another process removes a stale lock', { timeout: 3000 }, async () => {
        await writeLock(localLock({ pid: 2 ** 22 + 7, token: 'dead' }))
        await fs.writeFile(`${lockPath}.reap`, otherHolder())
        const readFile = vi.spyOn(fs, 'readFile')
        const install = vi.fn()

        try {
            await withInstallLock(lockPath, isInstalled, install, { ...fast, pollInterval: 20, maxWait: 200 })

            expect(install).toHaveBeenCalledTimes(1)
            expect(readFile.mock.calls.length).toBeLessThan(60)
        } finally {
            readFile.mockRestore()
        }
    })

    /**
     * e.g. a full disk: an empty lock would make the other processes wait for nothing
     */
    it('removes its lock when it cannot write it', async () => {
        const open = fs.open
        const spy = vi.spyOn(fs, 'open').mockImplementation(async (...args: Parameters<typeof fs.open>) => {
            const handle = await open(...args)
            handle.writeFile = () => Promise.reject(Object.assign(new Error('ENOSPC: no space left on device'), { code: 'ENOSPC' }))
            return handle
        })
        let lockedDuringInstall = true

        try {
            await withInstallLock(lockPath, isInstalled, async () => {
                lockedDuringInstall = await exists(lockPath)
            }, fast)
        } finally {
            spy.mockRestore()
        }

        expect(lockedDuringInstall).toBe(false)
    })

    it('takes the lock after short Windows errors instead of installing without it', async () => {
        const open = fs.open
        const busy = () => Promise.reject(Object.assign(new Error('EPERM: operation not permitted'), { code: 'EPERM' }))
        const spy = vi.spyOn(fs, 'open').mockImplementationOnce(busy).mockImplementationOnce(busy)
            .mockImplementation((...args: Parameters<typeof fs.open>) => open(...args))
        let lockedDuringInstall = false

        try {
            await withInstallLock(lockPath, isInstalled, async () => {
                lockedDuringInstall = await exists(lockPath)
            }, fast)
        } finally {
            spy.mockRestore()
        }

        expect(lockedDuringInstall).toBe(true)
    })

    it('removes its lock when Windows holds it for a moment', async () => {
        const rm = fs.rm
        const spy = vi.spyOn(fs, 'rm').mockImplementationOnce(
            () => Promise.reject(Object.assign(new Error('EBUSY: resource busy or locked'), { code: 'EBUSY' }))
        ).mockImplementation((...args: Parameters<typeof fs.rm>) => rm(...args))

        try {
            await withInstallLock(lockPath, isInstalled, async () => {}, fast)
        } finally {
            spy.mockRestore()
        }

        expect(await exists(lockPath)).toBe(false)
    })

    /**
     * the holder keeps running (and using the browser): the others must not take its
     * lock for the one of an install that did not finish and remove the browser
     */
    it('marks its lock as installed when it cannot remove it', async () => {
        const rm = fs.rm
        const spy = vi.spyOn(fs, 'rm').mockImplementation((file, ...args) => file === lockPath
            ? Promise.reject(Object.assign(new Error('EACCES: permission denied'), { code: 'EACCES' }))
            : rm(file, ...args))
        try {
            await withInstallLock(lockPath, isInstalled, download(), fast)
        } finally {
            spy.mockRestore()
        }
        const onStaleLock = vi.fn(async () => {})
        const startedAt = Date.now()

        await withInstallLock(lockPath, isInstalled, download(), { ...fast, onStaleLock })

        expect(onStaleLock).not.toHaveBeenCalled()
        expect(downloads).toBe(1)
        expect(Date.now() - startedAt).toBeLessThan(1000)
        expect(await exists(lockPath)).toBe(false)
    })

    /**
     * removing a build folder can take longer than staleAfter: the others must not
     * take `.reap` for stale and start a second cleanup or an install meanwhile
     */
    it('keeps its .reap fresh while it removes what a stale lock left', async () => {
        await writeLock(localLock({ pid: 2 ** 22 + 7, token: 'dead' }))
        const mtimes = new Set<number>()
        const onStaleLock = vi.fn(async () => {
            for (let i = 0; i < 10; i++) {
                await sleep(20)
                mtimes.add((await fs.stat(`${lockPath}.reap`)).mtimeMs)
            }
        })

        await withInstallLock(lockPath, isInstalled, vi.fn(), { ...fast, refreshInterval: 20, onStaleLock })

        expect(onStaleLock).toHaveBeenCalledTimes(1)
        expect(mtimes.size).toBeGreaterThan(2)
        expect(await exists(`${lockPath}.reap`)).toBe(false)
    })

    /**
     * two cache paths of one folder (a symlink) are two setups in one process
     */
    it('keeps its token until its lock is removed', async () => {
        const link = `${dir}-link`
        await fs.mkdir(path.dirname(lockPath), { recursive: true })
        await fs.symlink(dir, link)
        const linkedLockPath = path.join(link, 'chromium', '1715417.lock')
        const rm = fs.rm
        const spy = vi.spyOn(fs, 'rm').mockImplementation(async (file, ...args) => {
            if (file === lockPath) {
                // a slow file system: the second setup reads the lock meanwhile
                await sleep(100)
            }
            return rm(file, ...args)
        })
        const onStaleLock = vi.fn(async () => {})

        try {
            await Promise.all([
                withInstallLock(lockPath, isInstalled, download(), { ...fast, onStaleLock }),
                sleep(20).then(() => withInstallLock(linkedLockPath, isInstalled, download(), { ...fast, onStaleLock }))
            ])
        } finally {
            spy.mockRestore()
            await fs.rm(link)
        }

        expect(onStaleLock).not.toHaveBeenCalled()
        expect(downloads).toBe(1)
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
