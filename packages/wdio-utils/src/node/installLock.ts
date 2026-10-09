import path from 'node:path'
import fsp from 'node:fs/promises'

import logger from '@wdio/logger'

const log = logger('@wdio/utils')

export interface InstallLockOptions {
    /**
     * how often a waiting process checks the lock and the installed browser
     */
    pollInterval?: number
    /**
     * a lock older than this belongs to an install that did not finish
     */
    staleAfter?: number
    /**
     * the longest wait; after it the process installs without the lock
     */
    maxWait?: number
}

interface LockContent {
    pid?: number
    startedAt?: number
}

const DEFAULT_OPTIONS: Required<InstallLockOptions> = {
    pollInterval: 250,
    staleAfter: 10 * 60 * 1000,
    maxWait: 10 * 60 * 1000
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function isRunning (pid: number) {
    try {
        process.kill(pid, 0)
        return true
    } catch (err) {
        /**
         * EPERM: the process runs but belongs to another user
         */
        return (err as NodeJS.ErrnoException).code === 'EPERM'
    }
}

/**
 * A lock is stale when its process no longer runs, or when it is older than
 * `staleAfter`. A lock that cannot be read yet (the holder has not written it)
 * counts by its file time.
 */
async function isStale (lockPath: string, staleAfter: number) {
    const [content, stat] = await Promise.all([
        fsp.readFile(lockPath, 'utf8').then((text) => JSON.parse(text) as LockContent).catch(() => undefined),
        fsp.stat(lockPath).catch(() => undefined)
    ])
    if (!stat) {
        return false
    }
    if (typeof content?.pid === 'number' && !isRunning(content.pid)) {
        return true
    }
    const startedAt = typeof content?.startedAt === 'number' ? content.startedAt : stat.mtimeMs
    return Date.now() - startedAt > staleAfter
}

async function tryLock (lockPath: string) {
    try {
        const handle = await fsp.open(lockPath, 'wx')
        await handle.writeFile(JSON.stringify({ pid: process.pid, startedAt: Date.now() } satisfies LockContent))
        await handle.close()
        return true
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
            return false
        }
        throw err
    }
}

/**
 * Run `install` while holding a lock file, so that two processes that set up the same
 * browser build in one cache do not download and unpack it at the same time. A
 * process that finds the lock waits until it is released, takes it, and skips
 * `install` when `isInstalled()` is then true. It does not check `isInstalled()`
 * while another process holds the lock: the executable can exist before the
 * other process has finished unpacking the browser.
 */
export async function withInstallLock (
    lockPath: string,
    isInstalled: () => Promise<boolean>,
    install: () => Promise<void>,
    options: InstallLockOptions = {}
): Promise<void> {
    const { pollInterval, staleAfter, maxWait } = { ...DEFAULT_OPTIONS, ...options }
    await fsp.mkdir(path.dirname(lockPath), { recursive: true })

    const waitStartedAt = Date.now()
    let loggedWait = false
    while (!await tryLock(lockPath)) {
        if (await isStale(lockPath, staleAfter)) {
            log.warn(`Removing stale install lock ${lockPath}`)
            await fsp.rm(lockPath, { force: true })
            continue
        }
        if (Date.now() - waitStartedAt > maxWait) {
            log.warn(`Waited ${maxWait}ms for the install lock ${lockPath}, installing without it`)
            return install()
        }
        if (!loggedWait) {
            log.info(`Waiting for another process that installs into ${path.dirname(lockPath)} (${lockPath})`)
            loggedWait = true
        }
        await sleep(pollInterval)
    }

    try {
        /**
         * the other process may have finished between our check and taking the lock
         */
        if (await isInstalled()) {
            return
        }
        await install()
    } finally {
        await fsp.rm(lockPath, { force: true })
    }
}
