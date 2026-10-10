import path from 'node:path'
import fsp from 'node:fs/promises'

interface ZipEntry {
    name: string
    size: number
    symlink: boolean
}

const END_OF_CENTRAL_DIRECTORY = 0x06054b50
const ZIP64_END_LOCATOR = 0x07064b50
const ZIP64_END_OF_CENTRAL_DIRECTORY = 0x06064b50
const CENTRAL_DIRECTORY_HEADER = 0x02014b50
const ZIP64_EXTRA_FIELD = 0x0001
const MAX_COMMENT = 0xffff

async function read (handle: fsp.FileHandle, position: number, length: number) {
    const buffer = Buffer.alloc(length)
    const { bytesRead } = await handle.read(buffer, 0, length, position)
    return buffer.subarray(0, bytesRead)
}

/**
 * The files of a zip archive with their unpacked size, from its central directory
 * (also zip64). Throws when the archive cannot be read.
 */
async function readZipEntries (archive: string): Promise<ZipEntry[]> {
    const handle = await fsp.open(archive, 'r')
    try {
        const { size: fileSize } = await handle.stat()
        const tailStart = Math.max(0, fileSize - 22 - MAX_COMMENT)
        const tail = await read(handle, tailStart, fileSize - tailStart)
        let end = -1
        for (let i = tail.length - 22; i >= 0; i--) {
            if (tail.readUInt32LE(i) === END_OF_CENTRAL_DIRECTORY) {
                end = i
                break
            }
        }
        if (end < 0) {
            throw new Error('no end of central directory')
        }
        let count = tail.readUInt16LE(end + 10)
        let directorySize = tail.readUInt32LE(end + 12)
        let directoryOffset = tail.readUInt32LE(end + 16)
        if (count === 0xffff || directorySize === 0xffffffff || directoryOffset === 0xffffffff) {
            const locator = end - 20
            if (locator < 0 || tail.readUInt32LE(locator) !== ZIP64_END_LOCATOR) {
                throw new Error('no zip64 end of central directory locator')
            }
            const zip64End = await read(handle, Number(tail.readBigUInt64LE(locator + 8)), 56)
            if (zip64End.readUInt32LE(0) !== ZIP64_END_OF_CENTRAL_DIRECTORY) {
                throw new Error('no zip64 end of central directory')
            }
            count = Number(zip64End.readBigUInt64LE(32))
            directorySize = Number(zip64End.readBigUInt64LE(40))
            directoryOffset = Number(zip64End.readBigUInt64LE(48))
        }

        const directory = await read(handle, directoryOffset, directorySize)
        const entries: ZipEntry[] = []
        let offset = 0
        for (let i = 0; i < count; i++) {
            if (directory.readUInt32LE(offset) !== CENTRAL_DIRECTORY_HEADER) {
                throw new Error(`no central directory header for entry ${i}`)
            }
            let size = directory.readUInt32LE(offset + 24)
            const nameLength = directory.readUInt16LE(offset + 28)
            const extraLength = directory.readUInt16LE(offset + 30)
            const commentLength = directory.readUInt16LE(offset + 32)
            const mode = directory.readUInt32LE(offset + 38) >>> 16
            const name = directory.toString('utf8', offset + 46, offset + 46 + nameLength)
            if (size === 0xffffffff) {
                /**
                 * zip64: the sizes are in the extra field, uncompressed first
                 */
                const extra = directory.subarray(offset + 46 + nameLength, offset + 46 + nameLength + extraLength)
                for (let at = 0; at + 4 <= extra.length;) {
                    const id = extra.readUInt16LE(at)
                    const length = extra.readUInt16LE(at + 2)
                    if (id === ZIP64_EXTRA_FIELD) {
                        size = Number(extra.readBigUInt64LE(at + 4))
                        break
                    }
                    at += 4 + length
                }
            }
            entries.push({ name, size, symlink: (mode & 0o170000) === 0o120000 })
            offset += 46 + nameLength + extraLength + commentLength
        }
        return entries
    } finally {
        await handle.close()
    }
}

/**
 * How many files of a zip archive are not completely unpacked into `folder`: missing,
 * or with another size than in the archive (an unpack that stopped in the middle of a
 * file). `undefined` when the archive cannot be read.
 */
export async function unfinishedFilesOfZip (archive: string, folder: string) {
    const entries = await readZipEntries(archive).catch(() => undefined)
    const files = entries?.filter((entry) => !entry.name.endsWith('/'))
    if (!files?.length) {
        return undefined
    }
    const unfinished = await Promise.all(files.map(async (entry) => {
        const stat = await fsp.lstat(path.join(folder, entry.name)).catch(() => undefined)
        /**
         * a symlink is unpacked as a link (macOS, Linux): its size is the one of its target path
         */
        return !stat || (!entry.symlink && stat.size !== entry.size)
    }))
    return unfinished.filter(Boolean).length
}
