import fs from 'node:fs'
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
     * a lock that does not change while a process waits for it this long (counted in
     * polls) belongs to an install that did not finish: its holder refreshes it
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
    /**
     * the pid namespace on Linux: containers can have the same host name and pids
     */
    pidns?: string
    token?: string
    /**
     * the install finished, but the holder could not remove its lock
     */
    installed?: boolean
}

type Lock = NonNullable<Awaited<ReturnType<typeof readLock>>>

const DEFAULT_OPTIONS: Required<InstallLockOptions> = {
    pollInterval: 250,
    staleAfter: 30 * 1000,
    refreshInterval: 5 * 1000,
    maxWait: 20 * 60 * 1000,
    onStaleLock: async () => {}
}

/**
 * errors that can pass on Windows, e.g. while another process removes or scans the file
 */
const TRANSIENT_ERRORS = ['EPERM', 'EBUSY']
const MAX_TRANSIENT_ERRORS = 10

/**
 * tokens of the locks that this process holds or waits for
 */
const heldTokens = new Set<string>()

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const exists = (file: string) => fsp.access(file).then(() => true, () => false)
const isTransient = (err: unknown) => TRANSIENT_ERRORS.includes((err as NodeJS.ErrnoException).code ?? '')

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
 * Tells whether a lock is stale. A lock of a process of this machine (same host name
 * and pid namespace) is stale at once when that process no longer runs, or when it has
 * the pid of this process but not one of its tokens (a crashed run in a container with
 * the same pid). Otherwise a lock is stale when it does not change during the polls of
 * `staleAfter`. That reads no clock: the clocks of other machines can differ, and a
 * computer that sleeps and wakes up counts as one poll, so the holder can refresh first.
 */
function staleCheck (staleAfter: number, pollInterval: number) {
    let seen: { key: string, polls: number } | undefined
    return (lock: Lock) => {
        const { pid, hostname, pidns, token } = lock.content ?? {}
        if (typeof pid === 'number' && hostname === os.hostname() && pidns === getPidNamespace()) {
            if (pid === process.pid ? !(token && heldTokens.has(token)) : !isRunning(pid)) {
                return true
            }
        }
        const key = `${token}:${lock.mtimeMs}`
        if (seen?.key !== key) {
            seen = { key, polls: 0 }
            return false
        }
        return ++seen.polls * pollInterval >= staleAfter
    }
}

/**
 * remove a file, also when Windows holds it for a moment
 */
async function removeFile (file: string) {
    for (let attempt = 1; ; attempt++) {
        try {
            return await fsp.rm(file, { force: true })
        } catch (err) {
            if (attempt >= 5 || !isTransient(err)) {
                throw err
            }
            await sleep(100 * attempt)
        }
    }
}

function lockContent (token: string, installed?: true): LockContent {
    return { pid: process.pid, hostname: os.hostname(), pidns: getPidNamespace(), token, installed }
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
        await handle.writeFile(JSON.stringify(lockContent(token)))
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
async function removeLockOf (lockPath: string, lock: Lock) {
    const current = await readLock(lockPath)
    if (current && current.content?.token === lock.content?.token && current.mtimeMs === lock.mtimeMs) {
        await removeFile(lockPath)
    }
}

/**
 * Remove a stale lock. Two processes that find the same stale lock must not both
 * remove "it": the second would remove the lock that the first has just taken. So
 * one process at a time removes, under `<lock>.reap`, and only the lock that it saw.
 * Resolves `true` when this process removed it.
 */
async function removeStaleLock (
    lockPath: string,
    stale: Lock,
    token: string,
    isReapStale: (lock: Lock) => boolean,
    onStaleLock: () => Promise<unknown>
) {
    const reapPath = `${lockPath}.reap`
    if (!await tryLock(reapPath, token).catch((err) => isTransient(err) ? false : Promise.reject(err))) {
        const reap = await readLock(reapPath)
        if (reap && isReapStale(reap)) {
            await removeLockOf(reapPath, reap)
        }
        return false
    }
    const reap = await readLock(reapPath)
    try {
        const current = await readLock(lockPath)
        if (!current || current.content?.token !== stale.content?.token || current.mtimeMs !== stale.mtimeMs) {
            return false
        }
        log.warn(`Removing stale install lock ${lockPath} and what its install left`)
        await onStaleLock().catch((err) => log.warn(`Couldn't remove what the install of ${lockPath} left: ${(err as Error).message}`))
        /**
         * `onStaleLock` can take long enough for `.reap` to go stale and for another
         * process to remove the lock and take a new one
         */
        await removeLockOf(lockPath, current)
        return true
    } finally {
        if (reap) {
            await removeLockOf(reapPath, reap)
        }
    }
}

/**
 * Wait for the lock and take it. Resolves `false` when the process should install
 * without it: after `maxWait`, or when the lock says that the install finished.
 */
async function acquire (lockPath: string, token: string, { pollInterval, staleAfter, maxWait, onStaleLock }: Required<InstallLockOptions>) {
    await fsp.mkdir(path.dirname(lockPath), { recursive: true })
    const isStale = staleCheck(staleAfter, pollInterval)
    const isReapStale = staleCheck(staleAfter, pollInterval)
    const waitStartedAt = Date.now()
    let loggedWait = false
    let transientErrors = 0
    while (true) {
        const locked = await tryLock(lockPath, token).catch((err) => {
            if (isTransient(err) && ++transientErrors < MAX_TRANSIENT_ERRORS) {
                return false
            }
            throw err
        })
        if (locked) {
            return true
        }
        const lock = await readLock(lockPath)
        if (lock?.content?.installed) {
            /**
             * nothing to wait for: `install` finds the build without the lock
             */
            await removeLockOf(lockPath, lock).catch(() => {})
            return false
        }
        /**
         * try again at once only after removing the lock: while another process
         * removes it, wait like for a holder
         */
        if (lock && isStale(lock) && await removeStaleLock(lockPath, lock, token, isReapStale, onStaleLock)) {
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
}

/**
 * Remove our lock. If that fails, mark it as installed, so that the other processes
 * do not take it for the lock of an install that did not finish and remove the build.
 */
async function release (lockPath: string, token: string, installed: boolean) {
    const lock = await readLock(lockPath)
    if (!lock || lock.content?.token !== token) {
        return
    }
    try {
        /**
         * by token only: a refresh that was still running can have changed the file time
         */
        await removeFile(lockPath)
    } catch (err) {
        log.warn(`Couldn't remove the install lock ${lockPath}: ${(err as Error).message}`)
        if (installed) {
            await fsp.writeFile(lockPath, JSON.stringify(lockContent(token, true))).catch(() => {})
        }
    }
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
    let installed = false
    try {
        const result = await install()
        installed = true
        return result
    } finally {
        clearInterval(refresh)
        /**
         * remove the lock before the token: until then, the lock is ours
         */
        await release(lockPath, token, installed).catch(() => {})
        heldTokens.delete(token)
    }
}
