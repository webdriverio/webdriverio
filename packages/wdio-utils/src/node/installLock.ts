import os from 'node:os'
import path from 'node:path'
import crypto from 'node:crypto'
import fsp from 'node:fs/promises'

import logger from '@wdio/logger'

const log = logger('@wdio/utils')

export interface InstallLockOptions {
    /**
     * how often a waiting process checks the lock
     */
    pollInterval?: number
    /**
     * a lock that its holder has not refreshed for this long belongs to an install
     * that did not finish
     */
    staleAfter?: number
    /**
     * how often the holder refreshes its lock
     */
    refreshInterval?: number
    /**
     * the longest wait; after it the process installs without the lock
     */
    maxWait?: number
    /**
     * remove what the install of a stale lock left (it did not finish), before the
     * lock is removed and another process installs
     */
    onStaleLock?: () => Promise<unknown>
}

interface LockContent {
    pid?: number
    hostname?: string
    token?: string
}

const DEFAULT_OPTIONS: Required<InstallLockOptions> = {
    pollInterval: 250,
    staleAfter: 30 * 1000,
    refreshInterval: 5 * 1000,
    maxWait: 20 * 60 * 1000,
    onStaleLock: async () => {}
}

/**
 * tokens of the locks that this process holds
 */
const heldTokens = new Set<string>()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const exists = (file: string) => fsp.access(file).then(() => true, () => false)

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

async function readLock (lockPath: string) {
    const [content, stat] = await Promise.all([
        fsp.readFile(lockPath, 'utf8').then((text) => JSON.parse(text) as LockContent).catch(() => undefined),
        fsp.stat(lockPath).catch(() => undefined)
    ])
    return stat && { content, mtimeMs: stat.mtimeMs }
}

/**
 * A lock is stale when its holder has not refreshed it for `staleAfter`. A lock of this
 * machine is stale at once when its process no longer runs, or when it has the pid of
 * this process but not one of its tokens (a crashed run in a container with the same
 * pid). A lock that is not written yet counts by its file time.
 */
function isStale (lock: NonNullable<Awaited<ReturnType<typeof readLock>>>, staleAfter: number) {
    const { pid, hostname, token } = lock.content ?? {}
    if (typeof pid === 'number' && hostname === os.hostname()) {
        if (pid === process.pid ? !(token && heldTokens.has(token)) : !isRunning(pid)) {
            return true
        }
    }
    return Date.now() - lock.mtimeMs > staleAfter
}

async function tryLock (lockPath: string, token: string) {
    let handle: fsp.FileHandle
    try {
        handle = await fsp.open(lockPath, 'wx')
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'EEXIST') {
            return false
        }
        throw err
    }
    try {
        await handle.writeFile(JSON.stringify({ pid: process.pid, hostname: os.hostname(), token } satisfies LockContent))
    } catch (err) {
        /**
         * the file is ours: an empty lock would make the other processes wait for nothing
         */
        await handle.close().catch(() => {})
        await fsp.rm(lockPath, { force: true })
        throw err
    }
    await handle.close()
    return true
}

/**
 * Remove the lock only if it is still the one that was read: another process may
 * have removed it and taken a new one in the meantime.
 */
async function removeLockOf (lockPath: string, token: string | undefined) {
    const current = await readLock(lockPath)
    if (current && current.content?.token === token) {
        await fsp.rm(lockPath, { force: true })
    }
}

/**
 * Remove a stale lock. Two processes that find the same stale lock must not both
 * remove "it": the second would remove the lock that the first has just taken. So
 * one process at a time removes, under `<lock>.reap`, and checks the lock again first.
 * Resolves `true` when this process removed it.
 */
async function removeStaleLock (lockPath: string, stale: LockContent | undefined, token: string, { staleAfter, onStaleLock }: Required<InstallLockOptions>) {
    const reapPath = `${lockPath}.reap`
    if (!await tryLock(reapPath, token)) {
        const reap = await readLock(reapPath)
        if (reap && Date.now() - reap.mtimeMs > staleAfter) {
            await removeLockOf(reapPath, reap.content?.token)
        }
        return false
    }
    try {
        const current = await readLock(lockPath)
        if (!current || current.content?.token !== stale?.token || !isStale(current, staleAfter)) {
            return false
        }
        log.warn(`Removing stale install lock ${lockPath} and what its install left`)
        await onStaleLock().catch((err) => log.warn(`Couldn't remove what the install of ${lockPath} left: ${(err as Error).message}`))
        /**
         * `onStaleLock` can take long enough for `.reap` to go stale and for another
         * process to remove the lock and take a new one
         */
        await removeLockOf(lockPath, stale?.token)
        return true
    } finally {
        await removeLockOf(reapPath, token)
    }
}

/**
 * Wait for the lock and take it. Resolves `false` after `maxWait`.
 */
async function acquire (lockPath: string, token: string, options: Required<InstallLockOptions>) {
    const { pollInterval, staleAfter, maxWait } = options
    await fsp.mkdir(path.dirname(lockPath), { recursive: true })
    const waitStartedAt = Date.now()
    let loggedWait = false
    while (!await tryLock(lockPath, token)) {
        const lock = await readLock(lockPath)
        /**
         * try again at once only after removing the lock: while another process
         * removes it, wait like for a holder
         */
        if (lock && isStale(lock, staleAfter) && await removeStaleLock(lockPath, lock.content, token, options)) {
            continue
        }
        if (Date.now() - waitStartedAt > maxWait) {
            log.warn(`Waited ${maxWait}ms for the install lock ${lockPath}, installing without it`)
            return false
        }
        if (!loggedWait) {
            log.info(`Waiting for another process that installs into ${path.dirname(lockPath)} (${lockPath})`)
            loggedWait = true
        }
        await sleep(pollInterval)
    }
    return true
}

/**
 * Run `install` while holding a lock file, so that two processes that set up the same
 * build in one cache do not download and unpack it at the same time. A process that
 * finds the lock waits until it is released and then runs `install`, which finds what
 * the other process installed.
 *
 * Without a lock file and with `isInstalled()` true, `install` runs without the lock,
 * as before: the browser is there and no other process unpacks it. Check in this
 * order: the executable can exist before the holder has finished unpacking, and the
 * holder removes the lock only after that.
 *
 * The lock never fails a setup: when it cannot be created (e.g. a read-only cache),
 * `install` runs without it.
 */
export async function withInstallLock<T> (
    lockPath: string,
    isInstalled: () => Promise<boolean>,
    install: () => Promise<T>,
    options: InstallLockOptions = {}
): Promise<T> {
    const lockOptions = { ...DEFAULT_OPTIONS, ...options }
    if (await isInstalled() && !await exists(lockPath)) {
        return install()
    }

    /**
     * known before the lock file exists, so that another setup in this process never
     * takes the new lock for the one of a crashed run
     */
    const token = crypto.randomUUID()
    heldTokens.add(token)
    const locked = await acquire(lockPath, token, lockOptions).catch((err) => {
        log.info(`Couldn't create the install lock ${lockPath}, installing without it: ${(err as Error).message}`)
        return false
    })
    if (!locked) {
        heldTokens.delete(token)
        return install()
    }

    const refresh = setInterval(() => {
        const now = new Date()
        fsp.utimes(lockPath, now, now).catch(() => {})
    }, lockOptions.refreshInterval)
    refresh.unref()
    try {
        return await install()
    } finally {
        clearInterval(refresh)
        heldTokens.delete(token)
        await removeLockOf(lockPath, token).catch(() => {})
    }
}
