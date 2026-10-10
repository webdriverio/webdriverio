import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { readlinkSync } from 'node:fs'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { installAtomically, TEMP_FOLDER, type AtomicInstallTarget } from '../../src/node/atomicInstall.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const fast = { pollInterval: 10, staleAfter: 60_000, refreshInterval: 20, maxWait: 5_000, publishTimeout: 2_000 }
const exists = (file: string) => fs.access(file).then(() => true, () => false)
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * the pid namespace of this process on Linux, as the marker writes it
 */
const pidns = (() => {
    try {
        return readlinkSync('/proc/self/ns/pid')
    } catch {
        return undefined
    }
})()

/**
 * the marker of a process of this machine
 */
const localMarker = (content: object) => JSON.stringify({ hostname: os.hostname(), pidns, ...content })

describe('installAtomically', () => {
    let cacheDir: string
    let target: AtomicInstallTarget
    let downloads: number
    let running: number
    let maxRunning: number

    const buildDir = (dir: string) => path.join(dir, 'chromium', 'linux-1715417')

    /**
     * behaves like `install()` of `@puppeteer/browsers`: it unpacks the build into the
     * cache that it gets, the executable first and the rest of the browser after it
     */
    const download = (ms = 50) => vi.fn(async (dir: string) => {
        downloads++
        maxRunning = Math.max(maxRunning, ++running)
        try {
            await fs.mkdir(buildDir(dir), { recursive: true })
            await fs.writeFile(path.join(buildDir(dir), 'chrome'), '')
            await sleep(ms)
            await fs.writeFile(path.join(buildDir(dir), 'resources.pak'), '')
        } finally {
            running--
        }
    })

    const writeMarker = async (content: string) => {
        await fs.mkdir(path.dirname(target.markerPath), { recursive: true })
        await fs.writeFile(target.markerPath, content)
    }

    beforeEach(async () => {
        cacheDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-atomic-install-'))
        target = {
            cacheDir,
            buildDir,
            executablePath: path.join(buildDir(cacheDir), 'chrome'),
            markerPath: path.join(cacheDir, 'chromium', 'linux_1715417.installing')
        }
        downloads = running = maxRunning = 0
    })

    afterEach(async () => {
        await fs.rm(cacheDir, { recursive: true, force: true })
    })

    it('installs into a private folder and moves the complete build into the cache', async () => {
        let inCacheDuringInstall = true
        let installDir = ''
        await installAtomically(target, async (dir) => {
            installDir = dir
            await download()(dir)
            inCacheDuringInstall = await exists(buildDir(cacheDir))
        }, fast)

        expect(installDir).not.toBe(cacheDir)
        expect(path.dirname(installDir)).toBe(path.join(cacheDir, 'chromium', TEMP_FOLDER))
        expect(inCacheDuringInstall).toBe(false)
        expect(await fs.readdir(buildDir(cacheDir))).toEqual(['chrome', 'resources.pak'])
        expect(await fs.readdir(path.join(cacheDir, 'chromium', TEMP_FOLDER))).toEqual([])
        expect(await exists(target.markerPath)).toBe(false)
    })

    /**
     * the same file system as the build folder, also when the browser folder links to another disk
     */
    it('installs next to the build folder, also through a linked browser folder', async () => {
        const elsewhere = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-atomic-elsewhere-'))
        await fs.symlink(elsewhere, path.join(cacheDir, 'chromium'))
        let installDir = ''

        try {
            await installAtomically(target, async (dir) => {
                installDir = dir
                await download()(dir)
            }, fast)

            expect(path.dirname(installDir)).toBe(path.join(cacheDir, 'chromium', TEMP_FOLDER))
            expect(await fs.readdir(path.join(elsewhere, 'linux-1715417'))).toEqual(['chrome', 'resources.pak'])
        } finally {
            await fs.rm(elsewhere, { recursive: true, force: true })
        }
    })

    /**
     * `npx @puppeteer/browsers list` and `clear` read the browser folder
     */
    it('is not listed as an install by @puppeteer/browsers while it runs', async () => {
        const { Cache } = await import('@puppeteer/browsers')
        let listed: string[] = []
        await installAtomically(target, async (dir) => {
            await download()(dir)
            listed = new Cache(cacheDir).getInstalledBrowsers().map((browser) => browser.path)
        }, fast)

        expect(listed).toEqual([])
        expect(new Cache(cacheDir).getInstalledBrowsers().map((browser) => browser.buildId)).toEqual(['1715417'])
    })

    it('does nothing when the build is in the cache', async () => {
        await download()(cacheDir)
        const install = download()

        await installAtomically(target, install, fast)

        expect(install).not.toHaveBeenCalled()
        expect(await exists(path.join(cacheDir, 'chromium', TEMP_FOLDER))).toBe(false)
    })

    /**
     * a stopped process, a killed worker or Ctrl+C during the install
     */
    it('never has a half installed build in the cache', async () => {
        let seenPartial = false
        const watch = setInterval(async () => {
            if (await exists(target.executablePath) && !await exists(path.join(buildDir(cacheDir), 'resources.pak'))) {
                seenPartial = true
            }
        }, 1)

        try {
            await Promise.allSettled([
                installAtomically(target, async (dir) => {
                    await download(100)(dir)
                    throw new Error('stopped')
                }, fast),
                installAtomically(target, download(100), { ...fast, staleAfter: 0 })
            ])
        } finally {
            clearInterval(watch)
        }

        expect(seenPartial).toBe(false)
        expect(await exists(target.executablePath)).toBe(true)
    })

    it('lets concurrent setups download once', async () => {
        const install = download()

        await Promise.all([1, 2, 3, 4].map(() => installAtomically(target, install, fast)))

        expect(downloads).toBe(1)
        expect(await exists(target.executablePath)).toBe(true)
        expect(await exists(target.markerPath)).toBe(false)
    })

    it('uses the build of the process that published first', async () => {
        const install = download()

        /**
         * staleAfter 0: no waiting, both download
         */
        await Promise.all([1, 2].map(() => installAtomically(target, install, { ...fast, staleAfter: 0 })))

        expect(downloads).toBe(2)
        expect(maxRunning).toBe(2)
        expect(await fs.readdir(buildDir(cacheDir))).toEqual(['chrome', 'resources.pak'])
        expect(await fs.readdir(path.join(cacheDir, 'chromium', TEMP_FOLDER))).toEqual([])
    })

    it('replaces a build folder without the executable', async () => {
        await fs.mkdir(buildDir(cacheDir), { recursive: true })
        await fs.writeFile(path.join(buildDir(cacheDir), 'leftover'), '')

        await installAtomically(target, download(), fast)

        expect(await fs.readdir(buildDir(cacheDir))).toEqual(['chrome', 'resources.pak'])
    })

    it('installs after the other install failed', async () => {
        const results = await Promise.allSettled([
            installAtomically(target, async () => {
                await sleep(50)
                throw new Error('download failed')
            }, fast),
            sleep(10).then(() => installAtomically(target, download(), fast))
        ])

        expect(results.map((r) => r.status)).toEqual(['rejected', 'fulfilled'])
        expect(downloads).toBe(1)
        expect(await exists(target.executablePath)).toBe(true)
    })

    it('removes its private folder and its marker when the install fails', async () => {
        await expect(installAtomically(target, async (dir) => {
            await download()(dir)
            throw new Error('download failed')
        }, fast)).rejects.toThrow('download failed')

        expect(await fs.readdir(path.join(cacheDir, 'chromium', TEMP_FOLDER))).toEqual([])
        expect(await exists(target.markerPath)).toBe(false)
        expect(await exists(buildDir(cacheDir))).toBe(false)
    })

    it('does not wait for the marker of a process of this machine that no longer runs', async () => {
        await writeMarker(localMarker({ pid: 2 ** 22 + 7, token: 'dead' }))
        const startedAt = Date.now()

        await installAtomically(target, download(), fast)

        expect(Date.now() - startedAt).toBeLessThan(1000)
        expect(downloads).toBe(1)
        expect(await exists(target.markerPath)).toBe(false)
    })

    /**
     * a container that runs again can have the same pid (and pid namespace number)
     */
    it('does not wait for the marker of an earlier run with the pid of this process', async () => {
        await writeMarker(localMarker({ pid: process.pid, instance: 'earlier-run', token: 'old' }))
        const startedAt = Date.now()

        await installAtomically(target, download(), fast)

        expect(Date.now() - startedAt).toBeLessThan(1000)
        expect(downloads).toBe(1)
    })

    it('stops waiting for a marker that does not change for staleAfter', async () => {
        await writeMarker(localMarker({ pid: process.ppid, token: 'stalled' }))

        await installAtomically(target, download(), { ...fast, staleAfter: 100 })

        expect(downloads).toBe(1)
    })

    /**
     * the holder refreshes its marker: a slow download, a marker of another machine
     * (its pid means nothing here, its clock can differ) or of another container with
     * the same host name and pid
     */
    it.each([
        ['a live process of this machine', () => localMarker({ pid: process.ppid, token: 'live' })],
        ['another machine', () => JSON.stringify({ pid: 2 ** 22 + 7, hostname: 'other-machine', token: 'remote' })],
        ['another container', () => localMarker({ pid: process.pid, pidns: 'pid:[1]', token: 'container' })]
    ])('waits for the refreshed marker of %s and uses its build', async (_, marker) => {
        await writeMarker(marker())
        const refresh = setInterval(() => {
            const now = new Date()
            fs.utimes(target.markerPath, now, now).catch(() => {})
        }, 20)
        const otherDone = sleep(300).then(async () => {
            clearInterval(refresh)
            /**
             * the other process publishes its build with one rename too
             */
            const other = path.join(cacheDir, 'other')
            await download()(other)
            await fs.mkdir(path.dirname(buildDir(cacheDir)), { recursive: true })
            await fs.rename(buildDir(other), buildDir(cacheDir))
            await fs.rm(target.markerPath)
        })

        await installAtomically(target, download(), { ...fast, staleAfter: 100 })
        await otherDone

        expect(downloads).toBe(1)
    })

    it('keeps its marker fresh during a slow install', async () => {
        const options = { ...fast, staleAfter: 100 }
        const install = download(400)

        await Promise.all([
            installAtomically(target, install, options),
            sleep(20).then(() => installAtomically(target, install, options))
        ])

        expect(downloads).toBe(1)
    })

    it('installs without waiting when it cannot create the marker', async () => {
        await fs.writeFile(path.join(cacheDir, 'file'), '')

        await installAtomically({ ...target, markerPath: path.join(cacheDir, 'file', 'marker') }, download(), fast)

        expect(downloads).toBe(1)
        expect(await exists(target.executablePath)).toBe(true)
    })

    /**
     * a read-only cache without the build fails as before, and at once
     */
    it.skipIf(process.platform === 'win32')('fails at once in a read-only cache', async () => {
        await fs.mkdir(path.join(cacheDir, 'chromium'))
        await fs.chmod(path.join(cacheDir, 'chromium'), 0o555)
        const startedAt = Date.now()

        try {
            await expect(installAtomically(target, download(), fast)).rejects.toThrow('EACCES')
        } finally {
            await fs.chmod(path.join(cacheDir, 'chromium'), 0o755)
        }

        expect(Date.now() - startedAt).toBeLessThan(100)
        expect(downloads).toBe(0)
    })

    it('stops waiting after maxWait', async () => {
        await writeMarker(localMarker({ pid: process.ppid, token: 'live' }))
        const refresh = setInterval(() => {
            const now = new Date()
            fs.utimes(target.markerPath, now, now).catch(() => {})
        }, 20)

        try {
            await installAtomically(target, download(), { ...fast, staleAfter: 100, maxWait: 200 })
        } finally {
            clearInterval(refresh)
        }

        expect(downloads).toBe(1)
    })

    /**
     * Windows: a virus scan can hold the new files for a moment
     */
    it('retries the publish while Windows holds the folder', async () => {
        const rename = fs.rename
        const busy = () => Promise.reject(Object.assign(new Error('EPERM: operation not permitted, rename'), { code: 'EPERM' }))
        const spy = vi.spyOn(fs, 'rename').mockImplementationOnce(busy).mockImplementationOnce(busy)
            .mockImplementation((...args: Parameters<typeof fs.rename>) => rename(...args))

        try {
            await installAtomically(target, download(), fast)
        } finally {
            spy.mockRestore()
        }

        expect(await exists(target.executablePath)).toBe(true)
    })

    const blockPublish = () => {
        const rename = fs.rename
        return vi.spyOn(fs, 'rename').mockImplementation((from, to) => to === buildDir(cacheDir)
            ? Promise.reject(Object.assign(new Error('EPERM: operation not permitted, rename'), { code: 'EPERM' }))
            : rename(from, to))
    }

    /**
     * never in the cache in place: other setups would accept a half installed build
     */
    it('uses its private build when Windows holds it for longer than publishTimeout', async () => {
        const spy = blockPublish()
        let executable: string

        try {
            executable = await installAtomically(target, download(), { ...fast, publishTimeout: 200 })
        } finally {
            spy.mockRestore()
        }

        expect(path.dirname(path.dirname(path.relative(path.join(cacheDir, 'chromium', TEMP_FOLDER), executable)))).toMatch(/^i[^/\\]+[/\\]chromium$/)
        expect(await fs.readdir(path.dirname(executable))).toEqual(['chrome', 'resources.pak'])
        expect(await exists(buildDir(cacheDir))).toBe(false)
        expect(downloads).toBe(1)
        expect(await exists(target.markerPath)).toBe(false)
    })

    it('resolves the executable in the cache', async () => {
        await expect(installAtomically(target, download(), fast)).resolves.toBe(target.executablePath)
        await expect(installAtomically(target, download(), fast)).resolves.toBe(target.executablePath)
    })

    /**
     * its owner runs, and it is refreshed until the process ends
     */
    it('keeps its private build while this process runs, and a later setup publishes', async () => {
        const spy = blockPublish()
        let executable: string
        try {
            executable = await installAtomically(target, download(), { ...fast, publishTimeout: 200 })
        } finally {
            spy.mockRestore()
        }
        const privateFolder = path.join(cacheDir, 'chromium', TEMP_FOLDER, path.relative(path.join(cacheDir, 'chromium', TEMP_FOLDER), executable).split(path.sep)[0])
        const hourAgo = new Date(Date.now() - 60 * 60 * 1000)
        await fs.utimes(privateFolder, hourAgo, hourAgo)

        await expect(installAtomically(target, download(), fast)).resolves.toBe(target.executablePath)

        expect(await exists(executable)).toBe(true)
        expect(await fs.readdir(buildDir(cacheDir))).toEqual(['chrome', 'resources.pak'])
        expect(downloads).toBe(2)
    })

    it('uses its private build when it cannot move away a build folder without the executable', async () => {
        await fs.mkdir(buildDir(cacheDir), { recursive: true })
        await fs.writeFile(path.join(buildDir(cacheDir), 'leftover'), '')
        const rename = fs.rename
        const spy = vi.spyOn(fs, 'rename').mockImplementation((from, ...args) => from === buildDir(cacheDir)
            ? Promise.reject(Object.assign(new Error('EPERM: operation not permitted, rename'), { code: 'EPERM' }))
            : rename(from, ...args))
        let executable: string

        try {
            executable = await installAtomically(target, download(), { ...fast, publishTimeout: 300 })
        } finally {
            spy.mockRestore()
        }

        expect(executable).not.toBe(target.executablePath)
        expect(await exists(executable)).toBe(true)
        expect(await fs.readdir(buildDir(cacheDir))).toEqual(['leftover'])
    })

    /**
     * another process has created its marker and not written it yet
     */
    it('does not remove a marker that it did not create', async () => {
        await writeMarker('')
        const spy = vi.spyOn(fs, 'open').mockRejectedValueOnce(Object.assign(new Error('EIO: i/o error, open'), { code: 'EIO' }))

        try {
            await installAtomically(target, download(), fast)
        } finally {
            spy.mockRestore()
        }

        expect(await fs.readFile(target.markerPath, 'utf8')).toBe('')
    })

    it('removes its marker when it cannot write it', async () => {
        const open = fs.open
        const spy = vi.spyOn(fs, 'open').mockImplementationOnce(async (...args: Parameters<typeof fs.open>) => {
            const handle = await open(...args)
            handle.writeFile = () => Promise.reject(Object.assign(new Error('ENOSPC: no space left on device'), { code: 'ENOSPC' }))
            return handle
        })

        try {
            await installAtomically(target, download(), fast)
        } finally {
            spy.mockRestore()
        }

        expect(downloads).toBe(1)
        expect(await exists(target.markerPath)).toBe(false)
    })

    /**
     * a killed process or Ctrl+C leaves its private folder; a process that pauses (e.g. a
     * computer that sleeps for days) continues its install later
     */
    it('removes the private folders of installs that stopped, not of paused ones', async () => {
        const day = 24 * 60 * 60 * 1000
        const folders = {
            iDead: { owner: localMarker({ pid: 2 ** 22 + 7 }), age: 11 * 60 * 1000 },
            iEarlierRun: { owner: localMarker({ pid: process.pid, instance: 'earlier-run' }), age: 11 * 60 * 1000 },
            /**
             * two machines can have the same host name: a live one refreshes its folder
             */
            iDeadButRefreshed: { owner: localMarker({ pid: 2 ** 22 + 7 }), age: 0 },
            iPausedForDays: { owner: localMarker({ pid: process.ppid }), age: 3 * day },
            iOtherMachine: { owner: JSON.stringify({ pid: 2 ** 22 + 7, hostname: 'other-machine' }), age: 3 * day },
            iOtherMachineWeekOld: { owner: JSON.stringify({ pid: 2 ** 22 + 7, hostname: 'other-machine' }), age: 8 * day },
            iNoOwnerYet: { owner: undefined, age: 0 }
        }
        for (const [name, { owner, age }] of Object.entries(folders)) {
            const folder = path.join(cacheDir, 'chromium', TEMP_FOLDER, name)
            await fs.mkdir(folder, { recursive: true })
            if (owner) {
                await fs.writeFile(path.join(folder, 'owner.json'), owner)
            }
            const time = new Date(Date.now() - age)
            await fs.utimes(folder, time, time)
        }

        await installAtomically(target, download(), fast)

        expect((await fs.readdir(path.join(cacheDir, 'chromium', TEMP_FOLDER))).sort()).toEqual(['iDeadButRefreshed', 'iNoOwnerYet', 'iOtherMachine', 'iPausedForDays'])
    })

    /**
     * two processes replace the same folder without the executable: the other one moves
     * it away and publishes its build between this process's check and its move
     */
    /**
     * one process at a time checks and moves away a build folder without the executable
     */
    it('does not move away an unfinished build folder while another process replaces it', async () => {
        await fs.mkdir(buildDir(cacheDir), { recursive: true })
        await fs.writeFile(path.join(buildDir(cacheDir), 'leftover'), '')
        await writeMarker(localMarker({ pid: process.ppid, token: 'other' }))
        await fs.writeFile(`${target.markerPath}.replacing`, localMarker({ pid: process.ppid, token: 'other' }))
        const refresh = setInterval(() => {
            const now = new Date()
            fs.utimes(target.markerPath, now, now).catch(() => {})
        }, 20)
        /**
         * the other process: replaces the unfinished folder with its build
         */
        const otherDone = sleep(200).then(async () => {
            const other = path.join(cacheDir, 'other')
            await download()(other)
            await fs.writeFile(path.join(buildDir(other), 'published-by-other'), '')
            await fs.rename(buildDir(cacheDir), path.join(cacheDir, 'other-unfinished'))
            await fs.rename(buildDir(other), buildDir(cacheDir))
            await fs.rm(`${target.markerPath}.replacing`)
            clearInterval(refresh)
            await fs.rm(target.markerPath)
        })

        /**
         * staleAfter 0: this process does not wait for the marker and reaches the replace step
         */
        await installAtomically(target, download(), { ...fast, staleAfter: 0, publishTimeout: 2000 })
        await otherDone

        expect((await fs.readdir(buildDir(cacheDir))).sort()).toEqual(['chrome', 'published-by-other', 'resources.pak'])
    })

    it('removes the replace lock of a process that stopped', async () => {
        await fs.mkdir(buildDir(cacheDir), { recursive: true })
        await fs.writeFile(path.join(buildDir(cacheDir), 'leftover'), '')
        await fs.writeFile(`${target.markerPath}.replacing`, localMarker({ pid: 2 ** 22 + 7, token: 'dead' }))
        const install = download()

        await installAtomically(target, install, { ...fast, publishTimeout: 2000 })

        expect(install).toHaveBeenCalledTimes(1)
        expect(await fs.readdir(buildDir(cacheDir))).toEqual(['chrome', 'resources.pak'])
        expect(await exists(`${target.markerPath}.replacing`)).toBe(false)
    })

    it('does not move away a build that another process published meanwhile', async () => {
        await fs.mkdir(buildDir(cacheDir), { recursive: true })
        await fs.writeFile(path.join(buildDir(cacheDir), 'leftover'), '')
        const rename = fs.rename
        let raced = false
        const spy = vi.spyOn(fs, 'rename').mockImplementation(async (from, to) => {
            if (from === buildDir(cacheDir) && !raced) {
                raced = true
                // the other process: moves the unfinished folder away, publishes its build
                const other = path.join(cacheDir, 'other')
                await rename(buildDir(cacheDir), path.join(cacheDir, 'other-unfinished'))
                await download()(other)
                await fs.writeFile(path.join(buildDir(other), 'published-by-other'), '')
                await rename(buildDir(other), buildDir(cacheDir))
            }
            return rename(from, to)
        })

        try {
            await installAtomically(target, download(), fast)
        } finally {
            spy.mockRestore()
        }

        expect((await fs.readdir(buildDir(cacheDir))).sort()).toEqual(['chrome', 'published-by-other', 'resources.pak'])
    })

    it('refreshes its private folder while it installs', async () => {
        const mtimes = new Set<number>()
        await installAtomically(target, async (dir) => {
            for (let i = 0; i < 10; i++) {
                await sleep(20)
                mtimes.add((await fs.stat(dir)).mtimeMs)
            }
            await download()(dir)
        }, fast)

        expect(mtimes.size).toBeGreaterThan(2)
    })

    it('does not remove a marker that another process wrote meanwhile', async () => {
        await installAtomically(target, async (dir) => {
            await download()(dir)
            await fs.writeFile(target.markerPath, localMarker({ pid: process.ppid, token: 'other' }))
        }, fast)

        expect(await exists(target.markerPath)).toBe(true)
    })
})
