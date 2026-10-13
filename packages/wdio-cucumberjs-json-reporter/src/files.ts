import fs from 'node:fs'

/**
 * the time after which the lock of a JSON file is taken as left by a worker that ended
 */
const LOCK_TIMEOUT = 10_000

/**
 * Run `action` while this worker holds the lock of `file`: workers that run the same
 * feature (for example with other capabilities) read and write the same JSON file.
 * The lock is a folder next to the file, because `mkdir` fails when it exists.
 */
export function withFileLock<T> (file: string, action: () => T): T {
    const lock = `${file}.lock`
    const start = Date.now()
    for (;;) {
        try {
            fs.mkdirSync(lock)
            break
        } catch (error: unknown) {
            if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
                throw error
            }
            if (Date.now() - start > LOCK_TIMEOUT) {
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
