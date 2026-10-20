import fs from 'node:fs'
import path from 'node:path'

/**
 * the age after which a lock with no owner process id is taken as left by a worker
 * that ended between the creation of the lock and the write of its process id
 */
const LOCK_TIMEOUT = 10_000
/**
 * the age after which a lock is taken as left also when its process id runs: the id can
 * belong to another process now (a lock of an earlier run, a new container), and one
 * write takes much less time
 */
const LOCK_MAX_AGE = 60_000

/**
 * the rename of a file that Windows still has open (antivirus, search indexer) fails for a short time
 */
const RENAME_RETRIES = 20
const RENAME_RETRY_WAIT = 50
const BUSY_CODES = new Set(['EPERM', 'EBUSY', 'EACCES'])

/**
 * onRunnerEnd is synchronous: wait without the event loop
 */
function sleep (ms: number) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/**
 * milliseconds since the last change of the lock (of the link itself for a symbolic
 * link), undefined when it does not exist anymore
 */
function lockAge (lock: string) {
    try {
        return Date.now() - fs.lstatSync(lock).mtimeMs
    } catch {
        return undefined
    }
}

/**
 * true when the process that holds the lock does not run anymore, undefined when the
 * lock has no valid process id
 */
export function isLeft (lock: string) {
    let pid: number
    try {
        pid = Number(fs.readFileSync(path.join(lock, 'pid'), 'utf-8'))
    } catch {
        return undefined
    }
    // an empty or broken pid file: process.kill(0, 0) would check the process group of this process
    if (!Number.isInteger(pid) || pid <= 0) {
        return undefined
    }
    try {
        process.kill(pid, 0)
        return false
    } catch (error: unknown) {
        // EPERM: the process runs, as another user
        return (error as NodeJS.ErrnoException).code === 'ESRCH'
    }
}

/**
 * Run `action` while this worker holds the lock of `file`: workers that run the same
 * feature (for example with other capabilities) read and write the same JSON file.
 * The lock is a folder next to the file, because `mkdir` fails when it exists, with
 * the process id of its owner: a worker takes the lock of another worker when that
 * process does not run anymore, or when the lock is older than `maxAge`. The limits
 * use the age of the lock, not the time that this worker waited.
 */
export function withFileLock<T> (file: string, action: () => T, timeout = LOCK_TIMEOUT, maxAge = LOCK_MAX_AGE): T {
    const lock = `${file}.lock`
    for (;;) {
        try {
            fs.mkdirSync(lock)
            fs.writeFileSync(path.join(lock, 'pid'), String(process.pid))
            break
        } catch (error: unknown) {
            if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
                throw error
            }
            const left = isLeft(lock)
            const age = lockAge(lock)
            // the owner removed it in the meantime: try again
            if (age === undefined) {
                sleep(1)
                continue
            }
            if (left || (left === undefined && age > timeout) || age > maxAge) {
                fs.rmSync(lock, { recursive: true, force: true })
                continue
            }
            sleep(10)
        }
    }
    try {
        return action()
    } finally {
        fs.rmSync(lock, { recursive: true, force: true })
    }
}

/**
 * Write the file in one step: a worker never reads a half-written file. On Windows, the
 * rename can fail while another process still has the file open: try again, then write
 * the file directly (the caller holds the lock of the file, and each reader takes it too)
 */
export function writeFileAtomic (file: string, content: string) {
    const temporary = `${file}.${process.pid}.tmp`
    fs.writeFileSync(temporary, content)
    for (let attempt = 1; ; attempt++) {
        try {
            fs.renameSync(temporary, file)
            return
        } catch (error: unknown) {
            if (!BUSY_CODES.has((error as NodeJS.ErrnoException).code ?? '')) {
                fs.rmSync(temporary, { force: true })
                throw error
            }
            if (attempt >= RENAME_RETRIES) {
                fs.writeFileSync(file, content)
                fs.rmSync(temporary, { force: true })
                return
            }
            sleep(RENAME_RETRY_WAIT)
        }
    }
}
