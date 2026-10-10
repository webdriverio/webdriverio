import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import fsp from 'node:fs/promises'

import logger from '@wdio/logger'

const log = logger('@wdio/utils')

export interface AtomicInstallOptions {
    /**
     * how often a waiting process checks the other install
     */
    pollInterval?: number
    /**
     * stop waiting for another install whose marker does not change during the polls
     * of this time: its holder refreshes the marker while it runs
     */
    staleAfter?: number
    /**
     * how often the installing process refreshes its marker
     */
    refreshInterval?: number
    /**
     * the longest wait for another install
     */
    maxWait?: number
    /**
     * how long a short Windows error (e.g. a virus scan of the new files) can block
     * the publish of the build folder
     */
    publishTimeout?: number
}

export interface AtomicInstallTarget {
    /**
     * the cache of the build
     */
    cacheDir: string
    /**
     * the build folder of the build in a cache (`Cache#installationDir()`)
     */
    buildDir: (cacheDir: string) => string
    /**
     * the executable of the build in `cacheDir`
     */
    executablePath: string
    /**
     * the marker that tells the other processes that this build is being installed
     */
    markerPath: string
}

interface Marker {
    pid?: number
    hostname?: string
    pidns?: string
    /**
     * the process instance: a container that runs again can have the same pid
     */
    instance?: string
    token?: string
    /**
     * the build is installed in the cache directly (not atomically): its executable can
     * be there before the rest of the build
     */
    inPlace?: boolean
}

const DEFAULT_OPTIONS: Required<AtomicInstallOptions> = {
    pollInterval: 250,
    staleAfter: 30 * 1000,
    refreshInterval: 5 * 1000,
    maxWait: 20 * 60 * 1000,
    publishTimeout: 60 * 1000
}

/**
 * the folder of the private installs, next to the build folders (the same file system,
 * also when the browser folder is a link); without a `-`, so that `@puppeteer/browsers`
 * does not list it as a `<platform>-<buildId>` install. Each private folder has an `OWNER_FILE`.
 */
export const TEMP_FOLDER = '.wdio_install'
const OWNER_FILE = 'owner.json'
/**
 * a private folder whose owner cannot be checked (another machine) is removed after this
 */
const TEMP_MAX_AGE = 7 * 24 * 60 * 60 * 1000
/**
 * a private folder of a stopped process of this machine is removed when it has not been
 * refreshed for this long: two machines can have the same host name
 */
const TEMP_STOPPED_AGE = 10 * 60 * 1000

/**
 * errors that can pass on Windows, e.g. while a virus scan holds a new file; `EACCES`
 * only for a rename: when a file is created, it means a read-only cache
 */
const TRANSIENT_ERRORS = ['EPERM', 'EBUSY']
const TRANSIENT_RENAME_ERRORS = [...TRANSIENT_ERRORS, 'EACCES']
const MAX_TRANSIENT_ERRORS = 10

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const exists = (file: string) => fsp.access(file).then(() => true, () => false)
const errorCode = (err: unknown) => (err as NodeJS.ErrnoException).code ?? ''

/**
 * one per process, also when two copies of this package are loaded
 */
const INSTANCE_KEY = Symbol.for('wdio.atomicInstall.instance')
const globalWithInstance = globalThis as typeof globalThis & { [INSTANCE_KEY]?: string }
const INSTANCE = globalWithInstance[INSTANCE_KEY] ??= crypto.randomUUID()

let pidNamespace: string | undefined | null = null
function getPidNamespace () {
    if (pidNamespace === null) {
        try {
            pidNamespace = fs.readlinkSync('/proc/self/ns/pid')
        } catch {
            pidNamespace = undefined
        }
    }
    return pidNamespace
}

function isRunning (pid: number) {
    try {
        process.kill(pid, 0)
        return true
    } catch (err) {
        /**
         * EPERM: the process runs but belongs to another user
         */
        return errorCode(err) === 'EPERM'
    }
}

async function readMarker (markerPath: string) {
    const [content, stat] = await Promise.all([
        fsp.readFile(markerPath, 'utf8').then((text) => JSON.parse(text) as Marker).catch(() => undefined),
        fsp.stat(markerPath).catch(() => undefined)
    ])
    return stat && { content, mtimeMs: stat.mtimeMs }
}

/**
 * the pid, host name and pid namespace of this process, for a marker or a private folder
 */
function owner () {
    return { pid: process.pid, hostname: os.hostname(), pidns: getPidNamespace(), instance: INSTANCE }
}

/**
 * Tells whether the process of a marker or a private folder ran on this machine (same
 * host name and pid namespace: containers can share both) and no longer runs: its pid
 * does not run, or it is the pid of this process but of an earlier run (a container
 * that runs again).
 */
function hasStoppedHere ({ pid, hostname, pidns, instance }: Marker) {
    if (typeof pid !== 'number' || hostname !== os.hostname() || pidns !== getPidNamespace()) {
        return false
    }
    return pid === process.pid ? instance !== INSTANCE : !isRunning(pid)
}

/**
 * Tells whether the install of a marker has stopped. Only for waiting: a wrong answer
 * costs a second download, never a broken build. A marker of another process of this
 * machine (same host name and pid namespace: containers can share both) has stopped
 * when that process no longer runs. Otherwise it has stopped when it does not change
 * during the polls of `staleAfter`. That reads no clock: the clocks of other machines
 * can differ, and a computer that sleeps and wakes up counts as one poll.
 */
function stopCheck (staleAfter: number, pollInterval: number) {
    let seen: { key: string, polls: number } | undefined
    return (marker: NonNullable<Awaited<ReturnType<typeof readMarker>>>) => {
        const token = marker.content?.token
        if (marker.content && hasStoppedHere(marker.content)) {
            return true
        }
        const key = `${token}:${marker.mtimeMs}`
        if (seen?.key !== key) {
            seen = { key, polls: 0 }
            return false
        }
        return ++seen.polls * pollInterval >= staleAfter
    }
}

/**
 * Create the marker of this install, or resolve `undefined` when another process has it.
 * The marker is refreshed until `release()`.
 */
async function claim (markerPath: string, refreshInterval: number) {
    const token = crypto.randomUUID()
    if (!await createExclusive(markerPath, { ...owner(), token })) {
        return undefined
    }
    const stopRefresh = keepFresh(markerPath, refreshInterval)
    return {
        /**
         * replace the marker with one rename, so that the others never read it half written
         */
        markInPlace: async () => {
            const next = `${markerPath}.${token}`
            await fsp.writeFile(next, JSON.stringify({ ...owner(), token, inPlace: true } satisfies Marker))
            await fsp.rename(next, markerPath).catch(async (err) => {
                await fsp.rm(next, { force: true })
                throw err
            })
        },
        release: async () => {
            stopRefresh()
            await removeOwnMarker(markerPath, token).catch((err) => {
                log.warn(`Couldn't remove the install marker ${markerPath}: ${(err as Error).message}`)
            })
        }
    }
}

/**
 * Create a marker or a lock, or resolve `false` when it exists.
 */
async function createExclusive (file: string, content: Marker) {
    let handle: fsp.FileHandle
    try {
        handle = await fsp.open(file, 'wx')
    } catch (err) {
        if (errorCode(err) === 'EEXIST') {
            return false
        }
        throw err
    }
    try {
        await handle.writeFile(JSON.stringify(content))
    } catch (err) {
        /**
         * the file is ours: an empty one would make the others wait for nothing
         */
        await handle.close().catch(() => {})
        await fsp.rm(file, { force: true })
        throw err
    }
    await handle.close()
    return true
}

/**
 * Refresh the file time of a marker or a private folder while its process runs.
 */
function keepFresh (file: string, refreshInterval: number) {
    const refresh = setInterval(() => {
        const now = new Date()
        fsp.utimes(file, now, now).catch(() => {})
    }, refreshInterval)
    refresh.unref()
    return () => clearInterval(refresh)
}

async function removeOwnMarker (markerPath: string, token: string) {
    const marker = await readMarker(markerPath)
    if (marker?.content?.token === token) {
        await fsp.rm(markerPath, { force: true })
    }
}

/**
 * Claim the install of the build, or wait while another process installs it.
 * Resolves the claim, or `undefined` when this process installs without waiting longer
 * (the other install stopped, `maxWait`, or no marker can be written) or when the build
 * is now installed.
 */
async function claimOrWait (target: AtomicInstallTarget, options: Required<AtomicInstallOptions>) {
    const { markerPath, executablePath } = target
    const { pollInterval, staleAfter, refreshInterval, maxWait } = options
    await fsp.mkdir(path.dirname(markerPath), { recursive: true })
    const hasStopped = stopCheck(staleAfter, pollInterval)
    const waitStartedAt = Date.now()
    let loggedWait = false
    let transientErrors = 0
    while (true) {
        const claimed = await claim(markerPath, refreshInterval).catch((err) => {
            /**
             * e.g. Windows, while another process removes its marker
             */
            if (TRANSIENT_ERRORS.includes(errorCode(err)) && ++transientErrors < MAX_TRANSIENT_ERRORS) {
                return sleep(pollInterval).then(() => null)
            }
            throw err
        })
        if (claimed === null) {
            continue
        }
        if (claimed) {
            return claimed
        }
        const marker = await readMarker(markerPath)
        if (await exists(executablePath) && !marker?.content?.inPlace) {
            return undefined
        }
        if (!marker) {
            continue
        }
        if (hasStopped(marker)) {
            log.warn(`The install of ${markerPath} stopped, installing again`)
            /**
             * remove it only if it is still the one that stopped; at worst this removes
             * the marker of a new install, and two processes download the build
             */
            const current = await readMarker(markerPath)
            if (current && current.mtimeMs === marker.mtimeMs && current.content?.token === marker.content?.token) {
                await fsp.rm(markerPath, { force: true })
            }
            continue
        }
        if (Date.now() - waitStartedAt > maxWait) {
            log.warn(`Waited ${maxWait}ms for the install of ${markerPath}, installing without waiting longer`)
            return undefined
        }
        if (!loggedWait) {
            log.info(`Waiting for another process that installs into ${path.dirname(markerPath)} (${markerPath})`)
            loggedWait = true
        }
        await sleep(pollInterval)
    }
}

/**
 * Remove the private folders of installs that stopped: when the owner is a process of
 * this machine that no longer runs and the folder was not refreshed for
 * `TEMP_STOPPED_AGE`, or after `TEMP_MAX_AGE`. Not by age alone: a process can pause for
 * a long time (e.g. a computer that sleeps) and then continue its install.
 */
async function removeStoppedTempFolders (tempRoot: string) {
    const entries = await fsp.readdir(tempRoot).catch(() => [])
    await Promise.all(entries.map(async (entry) => {
        const folder = path.join(tempRoot, entry)
        const [stat, folderOwner] = await Promise.all([
            fsp.stat(folder).catch(() => undefined),
            fsp.readFile(path.join(folder, OWNER_FILE), 'utf8').then((text) => JSON.parse(text) as Marker).catch(() => undefined)
        ])
        const age = stat ? Date.now() - stat.mtimeMs : 0
        if (stat && ((folderOwner && hasStoppedHere(folderOwner) && age > TEMP_STOPPED_AGE) || age > TEMP_MAX_AGE)) {
            await fsp.rm(folder, { recursive: true, force: true }).catch(() => {})
        }
    }))
}

/**
 * Take the lock to replace an unfinished build folder: one process at a time checks and
 * moves it. Resolves `undefined` while another process has it. A stale lock only makes
 * the others wait: after `publishTimeout` they install in the cache directly.
 */
async function lockReplace (lockPath: string) {
    const token = crypto.randomUUID()
    /**
     * any error: not now (the publish retries until `publishTimeout`)
     */
    const created = await createExclusive(lockPath, { ...owner(), token }).catch(() => undefined)
    if (created === false) {
        const lock = await readMarker(lockPath)
        if (lock?.content && hasStoppedHere(lock.content)) {
            await fsp.rm(lockPath, { force: true })
        }
    }
    if (!created) {
        return undefined
    }
    return { unlock: () => removeOwnMarker(lockPath, token).catch(() => {}) }
}

/**
 * Move away the build folder `to` that has no executable, under the replace lock: while
 * we hold it, nobody else can move the folder away, so nobody can publish a build there
 * between our check and our move. If the moved folder is still not the one that we
 * checked (e.g. an older version that does not take the lock), it goes back at once.
 */
async function moveAwayUnfinished (target: AtomicInstallTarget, to: string, unfinished: fs.BigIntStats, trash: string) {
    const lock = await lockReplace(`${target.markerPath}.replacing`)
    if (!lock) {
        return
    }
    try {
        const current = await fsp.stat(to, { bigint: true }).catch(() => undefined)
        if (!current || current.ino !== unfinished.ino || current.dev !== unfinished.dev || await exists(target.executablePath)) {
            return
        }
        log.warn(`Replacing ${to}: the executable ${target.executablePath} is missing`)
        if (!await fsp.rename(to, trash).then(() => true, () => false)) {
            return
        }
        const moved = await fsp.stat(trash, { bigint: true }).catch(() => undefined)
        if (moved && (moved.ino !== unfinished.ino || moved.dev !== unfinished.dev)) {
            await fsp.rename(trash, to).catch(() => {})
        }
    } finally {
        await lock.unlock()
    }
}

/**
 * Move the build folder from the private install to the cache with one rename, so that
 * the cache never has a half installed build.
 */
async function publish (target: AtomicInstallTarget, tempDir: string, publishTimeout: number) {
    const from = target.buildDir(tempDir)
    const to = target.buildDir(target.cacheDir)
    await fsp.mkdir(path.dirname(to), { recursive: true })
    const startedAt = Date.now()
    for (let attempt = 1; ; attempt++) {
        try {
            return await fsp.rename(from, to)
        } catch (err) {
            if (await exists(target.executablePath)) {
                /**
                 * another process has published the build: use it
                 */
                return
            }
            if (Date.now() - startedAt > publishTimeout) {
                throw Object.assign(err as Error, { publishTimedOut: true })
            }
            const unfinished = await fsp.stat(to, { bigint: true }).catch(() => undefined)
            if (unfinished) {
                /**
                 * a build folder without the executable, left by an install that did not
                 * finish (e.g. of an older version that unpacked into the cache): move it away
                 */
                await moveAwayUnfinished(target, to, unfinished, path.join(tempDir, `unfinished-${attempt}`))
            } else if (!TRANSIENT_RENAME_ERRORS.includes(errorCode(err))) {
                throw err
            }
            await sleep(Math.min(100 * attempt, 1000))
        }
    }
}

/**
 * Install a build so that the cache never has it half installed, and so that processes
 * that set it up at the same time (e.g. two workers, which resolve `latest` or `stable`
 * again and can get a newer build than the launcher) download it once.
 *
 * `install(cacheDir)` installs the build into a private folder of the cache. Its build
 * folder is then moved into the cache with one rename: the first process wins, the
 * others use its build. A build folder in the cache is therefore complete, whatever
 * stops a process during the install. A marker makes the other processes wait while one
 * downloads; it only saves bandwidth: when it is wrong, two processes download.
 */
export async function installAtomically (
    target: AtomicInstallTarget,
    install: (cacheDir: string) => Promise<void>,
    options: AtomicInstallOptions = {}
) {
    if (await exists(target.executablePath)) {
        return
    }
    const installOptions = { ...DEFAULT_OPTIONS, ...options }
    const claimed = await claimOrWait(target, installOptions).catch((err) => {
        log.info(`Couldn't create the install marker ${target.markerPath}: ${(err as Error).message}`)
        return undefined
    })
    try {
        if (await exists(target.executablePath)) {
            return
        }
        const tempRoot = path.join(path.dirname(target.buildDir(target.cacheDir)), TEMP_FOLDER)
        await removeStoppedTempFolders(tempRoot)
        await fsp.mkdir(tempRoot, { recursive: true })
        const tempDir = await fsp.mkdtemp(path.join(tempRoot, 'i'))
        const stopRefresh = keepFresh(tempDir, installOptions.refreshInterval)
        try {
            await fsp.writeFile(path.join(tempDir, OWNER_FILE), JSON.stringify(owner()))
            await install(tempDir)
            await publish(target, tempDir, installOptions.publishTimeout).catch(async (err) => {
                if (!(err as { publishTimedOut?: boolean }).publishTimedOut) {
                    throw err
                }
                /**
                 * Windows still holds the folder (e.g. a long virus scan): install in the
                 * cache as before, rather than fail the setup
                 */
                log.warn(`Couldn't move the build into ${target.cacheDir} (${(err as Error).message}), installing it there directly`)
                await claimed?.markInPlace().catch(() => {})
                await install(target.cacheDir)
            })
        } finally {
            stopRefresh()
            await fsp.rm(tempDir, { recursive: true, force: true, maxRetries: 3 }).catch((err) => {
                log.warn(`Couldn't remove ${tempDir}: ${(err as Error).message}`)
            })
        }
    } finally {
        await claimed?.release()
    }
}
