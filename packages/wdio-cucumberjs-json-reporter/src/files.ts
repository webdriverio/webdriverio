import fs from 'node:fs'
import path from 'node:path'
import { createHash } from 'node:crypto'

/**
 * the age after which a lock is taken as left by a worker that ended while it wrote, or
 * by an earlier run: one write takes milliseconds (137 ms for a file of 108 MB)
 */
const LOCK_STALE_AGE = 30_000

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

/** names that Windows keeps for devices, also with an extension (`con.json`) */
const WINDOWS_DEVICE_NAME = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\.|$)/i

/**
 * onRunnerEnd writes the files before it returns (the runner waits only `reporterSyncTimeout`
 * for an async reporter, 5 s by default): wait without the event loop
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
 * Remove the lock: on Windows, a folder that another worker reads can fail to go for a short time
 */
function removeLock (lock: string) {
    fs.rmSync(lock, { recursive: true, force: true, maxRetries: 5, retryDelay: BUSY_RETRY_WAIT })
}

/**
 * Run `action` while this worker holds the lock of `file`: workers that run the same
 * feature (for example with other capabilities) read and write the same JSON file.
 * The lock is a folder next to the file, because `mkdir` fails when it exists. A worker
 * takes a lock that is older than `staleAge`, and throws after twice that wait instead
 * of waiting for ever (for example with the clock of a network drive). The workers must
 * run on the same machine, or with the same clock.
 */
export function withFileLock<T> (file: string, action: () => T, staleAge = LOCK_STALE_AGE): T {
    const lock = `${file}.lock`
    const deadline = Date.now() + 2 * staleAge
    for (let busyTries = 0; ;) {
        try {
            fs.mkdirSync(lock)
            break
        } catch (error: unknown) {
            const code = (error as NodeJS.ErrnoException).code ?? ''
            if (code !== 'EEXIST') {
                // Windows: a lock that another worker removes now is "delete pending"; a permission error that stays is thrown
                if (!BUSY_CODES.has(code) || ++busyTries > BUSY_RETRIES) {
                    throw error
                }
                sleep(BUSY_RETRY_WAIT)
                continue
            }
            busyTries = 0
            const age = lockAge(lock)
            // the owner removed it in the meantime: try again
            if (age === undefined) {
                sleep(1)
                continue
            }
            if (age > staleAge) {
                removeLock(lock)
                continue
            }
            if (Date.now() > deadline) {
                throw new Error(`The lock ${lock} is still taken after ${2 * staleAge / 1000} s: remove it when no worker writes this file`)
            }
            sleep(10)
        }
    }
    try {
        return action()
    } finally {
        removeLock(lock)
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
 * file name cannot have, and not a Windows device name. A long id (for example with many non-ASCII characters) is cut, with
 * a hash of the full id: 2 features keep 2 files, and the workers of a feature use one name
 */
export function fileIdOf (id: string) {
    const safeId = id.replace(/[\\/?%*:|"<> ]/g, '-')
    const fileId = WINDOWS_DEVICE_NAME.test(safeId) ? `_${safeId}` : safeId
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
