import fs from 'node:fs'
import path from 'node:path'

/**
 * the time after which a lock with no owner process id is taken as left by a worker
 * that ended between the creation of the lock and the write of its process id
 */
const LOCK_TIMEOUT = 10_000

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
 * the process id of its owner: a worker takes the lock of another worker only when
 * that process does not run anymore, never while it writes.
 */
export function withFileLock<T> (file: string, action: () => T, timeout = LOCK_TIMEOUT): T {
    const lock = `${file}.lock`
    const start = Date.now()
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
            if (left || (left === undefined && Date.now() - start > timeout)) {
                fs.rmSync(lock, { recursive: true, force: true })
                continue
            }
            // onRunnerEnd is synchronous: wait without the event loop
            Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10)
        }
    }
    try {
        return action()
    } finally {
        fs.rmSync(lock, { recursive: true, force: true })
    }
}

/**
 * Write the file in one step: a worker never reads a half-written file
 */
export function writeFileAtomic (file: string, content: string) {
    const temporary = `${file}.${process.pid}.tmp`
    fs.writeFileSync(temporary, content)
    fs.renameSync(temporary, file)
}
