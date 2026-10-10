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
    token?: string
}

const DEFAULT_OPTIONS: Required<AtomicInstallOptions> = {
    pollInterval: 250,
    staleAfter: 30 * 1000,
    refreshInterval: 5 * 1000,
    maxWait: 20 * 60 * 1000,
    publishTimeout: 30 * 1000
}

/**
 * the folder of the private installs in the cache; temporary folders older than
 * `TEMP_MAX_AGE` belong to processes that stopped
 */
export const TEMP_FOLDER = '.wdio-install'
const TEMP_MAX_AGE = 24 * 60 * 60 * 1000

/**
 * errors that can pass on Windows, e.g. while a virus scan holds a new file
 */
const TRANSIENT_ERRORS = ['EPERM', 'EACCES', 'EBUSY']
const MAX_TRANSIENT_ERRORS = 10

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const exists = (file: string) => fsp.access(file).then(() => true, () => false)
const errorCode = (err: unknown) => (err as NodeJS.ErrnoException).code ?? ''

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
        const { pid, hostname, pidns, token } = marker.content ?? {}
        if (
            typeof pid === 'number' && pid !== process.pid &&
            hostname === os.hostname() && pidns === getPidNamespace() &&
            !isRunning(pid)
        ) {
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
    let handle: fsp.FileHandle
    try {
        handle = await fsp.open(markerPath, 'wx')
    } catch (err) {
        if (errorCode(err) === 'EEXIST') {
            return undefined
        }
        throw err
    }
    try {
        await handle.writeFile(JSON.stringify({
            pid: process.pid, hostname: os.hostname(), pidns: getPidNamespace(), token
        } satisfies Marker))
    } catch (err) {
        /**
         * the file is ours: an empty marker would make the others wait for nothing
         */
        await handle.close().catch(() => {})
        await fsp.rm(markerPath, { force: true })
        throw err
    }
    await handle.close()
    const refresh = setInterval(() => {
        const now = new Date()
        fsp.utimes(markerPath, now, now).catch(() => {})
    }, refreshInterval)
    refresh.unref()
    return {
        release: async () => {
            clearInterval(refresh)
            await removeOwnMarker(markerPath, token).catch((err) => {
                log.warn(`Couldn't remove the install marker ${markerPath}: ${(err as Error).message}`)
            })
        }
    }
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
        if (await exists(executablePath)) {
            return undefined
        }
        const marker = await readMarker(markerPath)
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
 * Remove the temporary folders of installs that stopped long ago.
 */
async function removeOldTempFolders (tempRoot: string) {
    const entries = await fsp.readdir(tempRoot).catch(() => [])
    await Promise.all(entries.map(async (entry) => {
        const folder = path.join(tempRoot, entry)
        const stat = await fsp.stat(folder).catch(() => undefined)
        if (stat && Date.now() - stat.mtimeMs > TEMP_MAX_AGE) {
            await fsp.rm(folder, { recursive: true, force: true }).catch(() => {})
        }
    }))
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
                throw err
            }
            if (await exists(to)) {
                /**
                 * a build folder without the executable, left by an install that did not
                 * finish (e.g. of an older version that unpacked into the cache): move it away
                 */
                log.warn(`Replacing ${to}: the executable ${target.executablePath} is missing`)
                await fsp.rename(to, path.join(tempDir, `unfinished-${attempt}`)).catch(() => {})
            } else if (!TRANSIENT_ERRORS.includes(errorCode(err))) {
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
        const tempRoot = path.join(target.cacheDir, TEMP_FOLDER)
        await removeOldTempFolders(tempRoot)
        await fsp.mkdir(tempRoot, { recursive: true })
        const tempDir = await fsp.mkdtemp(path.join(tempRoot, 'i'))
        try {
            await install(tempDir)
            await publish(target, tempDir, installOptions.publishTimeout)
        } finally {
            await fsp.rm(tempDir, { recursive: true, force: true, maxRetries: 3 }).catch((err) => {
                log.warn(`Couldn't remove ${tempDir}: ${(err as Error).message}`)
            })
        }
    } finally {
        await claimed?.release()
    }
}
