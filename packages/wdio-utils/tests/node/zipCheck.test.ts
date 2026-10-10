import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs/promises'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'

import { unfinishedFilesOfZip } from '../../src/node/zipCheck.js'

interface Entry {
    name: string
    size?: number
    symlink?: boolean
}

/**
 * Writes the central directory of a zip archive (the file data is not needed to read
 * it), as `zip64` with the sizes in the zip64 extra field and a zip64 end record.
 */
function zipArchive (entries: Entry[], { zip64 = false } = {}) {
    const headers = entries.map((entry) => {
        const name = Buffer.from(entry.name)
        const size = entry.size ?? 0
        const extra = zip64 ? Buffer.alloc(4 + 16) : Buffer.alloc(0)
        if (zip64) {
            extra.writeUInt16LE(0x0001, 0)
            extra.writeUInt16LE(16, 2)
            extra.writeBigUInt64LE(BigInt(size), 4)
            extra.writeBigUInt64LE(BigInt(size), 12)
        }
        const header = Buffer.alloc(46)
        header.writeUInt32LE(0x02014b50, 0)
        header.writeUInt32LE(zip64 ? 0xffffffff : size, 20)
        header.writeUInt32LE(zip64 ? 0xffffffff : size, 24)
        header.writeUInt16LE(name.length, 28)
        header.writeUInt16LE(extra.length, 30)
        header.writeUInt32LE(((entry.symlink ? 0o120777 : 0o100644) << 16) >>> 0, 38)
        return Buffer.concat([header, name, extra])
    })
    const directory = Buffer.concat(headers)
    const end = Buffer.alloc(22)
    end.writeUInt32LE(0x06054b50, 0)
    if (!zip64) {
        end.writeUInt16LE(entries.length, 10)
        end.writeUInt32LE(directory.length, 12)
        end.writeUInt32LE(0, 16)
        return Buffer.concat([directory, end])
    }
    const zip64End = Buffer.alloc(56)
    zip64End.writeUInt32LE(0x06064b50, 0)
    zip64End.writeBigUInt64LE(BigInt(entries.length), 32)
    zip64End.writeBigUInt64LE(BigInt(directory.length), 40)
    zip64End.writeBigUInt64LE(0n, 48)
    const locator = Buffer.alloc(20)
    locator.writeUInt32LE(0x07064b50, 0)
    locator.writeBigUInt64LE(BigInt(directory.length), 8)
    end.writeUInt16LE(0xffff, 10)
    end.writeUInt32LE(0xffffffff, 12)
    end.writeUInt32LE(0xffffffff, 16)
    return Buffer.concat([directory, zip64End, locator, end])
}

describe('unfinishedFilesOfZip', () => {
    let dir: string
    let archive: string
    let folder: string

    const entries: Entry[] = [
        { name: 'chrome-win64/' },
        { name: 'chrome-win64/chrome.exe', size: 300 },
        { name: 'chrome-win64/resources/', size: 0 },
        { name: 'chrome-win64/resources/a.pak', size: 1200 },
        { name: 'chrome-win64/empty.txt', size: 0 }
    ]

    /**
     * the build folder as `unzip` leaves it
     */
    const unpack = async () => {
        for (const entry of entries) {
            await (entry.name.endsWith('/')
                ? fs.mkdir(path.join(folder, entry.name), { recursive: true })
                : fs.writeFile(path.join(folder, entry.name), Buffer.alloc(entry.size ?? 0)))
        }
    }

    beforeEach(async () => {
        dir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-zip-check-'))
        archive = path.join(dir, '155.0.8059.39-chrome-win64.zip')
        folder = path.join(dir, 'win64-155.0.8059.39')
    })

    afterEach(async () => {
        await fs.rm(dir, { recursive: true, force: true })
    })

    it.each([false, true])('finds no unfinished file in a complete unpack (zip64: %s)', async (zip64) => {
        await fs.writeFile(archive, zipArchive(entries, { zip64 }))
        await unpack()

        await expect(unfinishedFilesOfZip(archive, folder)).resolves.toBe(0)
    })

    /**
     * an unpack that stopped while it wrote a file leaves it shorter
     */
    it.each([false, true])('counts a file that is shorter than in the archive (zip64: %s)', async (zip64) => {
        await fs.writeFile(archive, zipArchive(entries, { zip64 }))
        await unpack()
        await fs.truncate(path.join(folder, 'chrome-win64/resources/a.pak'), 1000)

        await expect(unfinishedFilesOfZip(archive, folder)).resolves.toBe(1)
    })

    it('counts a missing file', async () => {
        await fs.writeFile(archive, zipArchive(entries))
        await unpack()
        await fs.rm(path.join(folder, 'chrome-win64/chrome.exe'))

        await expect(unfinishedFilesOfZip(archive, folder)).resolves.toBe(1)
    })

    /**
     * macOS archives have symlinks: unpacked as links, their size is the one of the target path
     */
    it.skipIf(process.platform === 'win32')('checks a symlink by its presence only', async () => {
        const withLink = [...entries, { name: 'chrome-win64/Current', size: 1, symlink: true }]
        await fs.writeFile(archive, zipArchive(withLink))
        await unpack()
        await fs.symlink('resources', path.join(folder, 'chrome-win64/Current'))

        await expect(unfinishedFilesOfZip(archive, folder)).resolves.toBe(0)
        await fs.rm(path.join(folder, 'chrome-win64/Current'))
        await expect(unfinishedFilesOfZip(archive, folder)).resolves.toBe(1)
    })

    it('cannot tell when the archive cannot be read', async () => {
        await fs.writeFile(archive, 'not a zip archive')

        await expect(unfinishedFilesOfZip(archive, folder)).resolves.toBeUndefined()
        await expect(unfinishedFilesOfZip(path.join(dir, 'missing.zip'), folder)).resolves.toBeUndefined()
    })

    it('cannot tell when the archive has no file', async () => {
        await fs.writeFile(archive, zipArchive([{ name: 'chrome-win64/' }]))

        await expect(unfinishedFilesOfZip(archive, folder)).resolves.toBeUndefined()
    })

    it('reads a real zip archive', async () => {
        /**
         * one stored file, written by Info-ZIP `zip -0 -X`
         */
        const real = Buffer.from(
            'UEsDBAoAAAAAAB1gSl0gMDo2BgAAAAYAAAAFAAAAYS50eHRoZWxsbwpQSwECHgMKAAAAAAAdYEpdIDA6NgYAAAAGAAAABQAAAAAAAAAAAAAApIEAAAAA' +
            'YS50eHRQSwUGAAAAAAEAAQAzAAAAKQAAAAAA', 'base64')
        await fs.writeFile(archive, real)
        await fs.mkdir(folder, { recursive: true })
        await fs.writeFile(path.join(folder, 'a.txt'), 'hello\n')

        await expect(unfinishedFilesOfZip(archive, folder)).resolves.toBe(0)
        await fs.writeFile(path.join(folder, 'a.txt'), 'hell')
        await expect(unfinishedFilesOfZip(archive, folder)).resolves.toBe(1)
    })
})
