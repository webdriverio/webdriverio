import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

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
 * Windows: the rename of a file that another process still has open (antivirus, search
 * indexer), and the creation of a lock that another worker removes ("delete pending"),
 * fail for a short time
 */
const BUSY_RETRIES = 20
const BUSY_RETRY_WAIT = 50
const BUSY_CODES = new Set(['EPERM', 'EBUSY', 'EACCES'])

/**
 * the bytes of the feature part of a file name: Linux file systems allow 255 bytes, and the
 * unique id, `.json` and the names of the lock and of the temporary file add about 30
 */
const MAX_FILE_ID_BYTES = 200

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
    for (let busyTries = 0; ;) {
        try {
            fs.mkdirSync(lock)
            fs.writeFileSync(path.join(lock, 'pid'), String(process.pid))
            break
        } catch (error: unknown) {
            const code = (error as NodeJS.ErrnoException).code ?? ''
            if (code !== 'EEXIST') {
                // a permission error that stays is thrown
                if (!BUSY_CODES.has(code) || ++busyTries > BUSY_RETRIES) {
                    throw error
                }
                sleep(BUSY_RETRY_WAIT)
                continue
            }
            busyTries = 0
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
            if (attempt >= BUSY_RETRIES) {
                fs.writeFileSync(file, content)
                fs.rmSync(temporary, { force: true })
                return
            }
            sleep(BUSY_RETRY_WAIT)
        }
    }
}

/**
 * Write a new file `<name>.json`, or `<name>-1.json`, `<name>-2.json`, ... when that name
 * exists: 2 workers can make the same unique id, and one must not replace the file of the other
 */
export function writeNewFile (folder: string, name: string, content: string) {
    for (let suffix = 0; ; suffix++) {
        const file = path.join(folder, suffix ? `${name}-${suffix}.json` : `${name}.json`)
        try {
            fs.writeFileSync(file, content, { flag: 'wx' })
            return file
        } catch (error: unknown) {
            if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
                throw error
            }
        }
    }
}

/**
 * The feature part of the name of a JSON file: the feature id without the characters that a
 * file name cannot have. A long id (for example with many non-ASCII characters) is cut, with
 * a hash of the full id: 2 features keep 2 files, and the workers of a feature use one name
 */
export function fileIdOf (id: string) {
    const fileId = id.replace(/[\\/?%*:|"<> ]/g, '-')
    if (Buffer.byteLength(fileId) <= MAX_FILE_ID_BYTES) {
        return fileId
    }
    const hash = createHash('sha256').update(id).digest('hex').slice(0, 8)
    let bytes = hash.length + 1
    let end = 0
    // cut between 2 characters, not in the bytes of a character
    for (const char of fileId) {
        bytes += Buffer.byteLength(char)
        if (bytes > MAX_FILE_ID_BYTES) {
            break
        }
        end += char.length
    }
    return `${fileId.slice(0, end)}-${hash}`
}

/**
 * The features of an earlier JSON file, none when there is no file. A file that is not a
 * list of features (for example cut by a worker of an older version that ended while it
 * wrote) is renamed to `<name>.json.invalid-<time>`: the new file must be valid JSON, and
 * multiple-cucumber-html-reporter reads all the `.json` files of the folder
 */
export function readEarlierFeatures (file: string): { features: unknown[], invalidKeptAs?: string } {
    let text: string
    try {
        text = fs.readFileSync(file, 'utf-8')
    } catch (error: unknown) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            return { features: [] }
        }
        throw error
    }
    try {
        const features: unknown = JSON.parse(text)
        if (Array.isArray(features)) {
            return { features }
        }
    } catch {
        // not JSON
    }
    const invalidKeptAs = `${file}.invalid-${Date.now()}`
    fs.renameSync(file, invalidKeptAs)
    return { features: [], invalidKeptAs }
}
