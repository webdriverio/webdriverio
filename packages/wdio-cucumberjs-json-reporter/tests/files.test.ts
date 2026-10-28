import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { fileIdOf, withFileLock, writeFileAtomic } from '../src/files.js'

const busy = (code: string) => Object.assign(new Error(`${code}: operation not permitted`), { code })

describe('withFileLock', () => {
    const dirs: string[] = []
    afterEach(() => {
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })
    const tempFile = () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cjson-lock-'))
        dirs.push(dir)
        return path.join(dir, 'feature.json')
    }

    it('waits for a young lock of another worker', async () => {
        const file = tempFile()
        const lock = `${file}.lock`
        // another worker holds the lock for 300 ms (one write takes milliseconds)
        const other = spawn(process.execPath, ['-e', `
            const fs = require('node:fs')
            fs.mkdirSync(${JSON.stringify(lock)})
            console.log('locked')
            setTimeout(() => {
                fs.writeFileSync(${JSON.stringify(file)}, 'other')
                fs.rmSync(${JSON.stringify(lock)}, { recursive: true })
            }, 300)
        `])
        const exited = new Promise((resolve) => other.once('exit', resolve))
        await new Promise((resolve) => other.stdout.once('data', resolve))
        const seen = withFileLock(file, () => fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : 'no file', 1000)
        await exited
        // the action ran after the other worker wrote its file
        expect(seen).toBe('other')
    })

    it('takes a lock older than the limit at once (a worker that ended while it wrote, or an earlier run)', () => {
        const file = tempFile()
        const lock = `${file}.lock`
        fs.mkdirSync(lock)
        const old = new Date(Date.now() - 120_000)
        fs.utimesSync(lock, old, old)
        const start = Date.now()
        expect(withFileLock(file, () => 'done')).toBe('done')
        expect(Date.now() - start).toBeLessThan(1000)
        expect(fs.existsSync(lock)).toBe(false)
    })

    it('throws instead of waiting for ever for a lock that does not get old (the clock of a network drive)', () => {
        const file = tempFile()
        const lock = `${file}.lock`
        fs.mkdirSync(lock)
        const future = new Date(Date.now() + 3_600_000)
        fs.utimesSync(lock, future, future)
        const start = Date.now()
        expect(() => withFileLock(file, () => 'done', 100)).toThrow(`The lock ${lock} is still taken after 0.2 s`)
        expect(Date.now() - start).toBeLessThan(2000)
        // the lock of the other worker stays
        expect(fs.existsSync(lock)).toBe(true)
    })

    it.skipIf(process.platform === 'win32')('takes a lock path that is a broken symbolic link after the limit (no busy loop)', () => {
        const file = tempFile()
        const lock = `${file}.lock`
        // mkdir fails with EEXIST, and stat of the link target fails
        fs.symlinkSync(path.join(path.dirname(file), 'missing-target'), lock)
        expect(withFileLock(file, () => 'done', 100)).toBe('done')
        expect(fs.existsSync(lock)).toBe(false)
    })

    it('tries again when Windows gives EPERM for the lock that another worker removes now', () => {
        const file = tempFile()
        const mkdir = fs.mkdirSync
        let calls = 0
        // the folder is "delete pending" for a short time
        const spy = vi.spyOn(fs, 'mkdirSync').mockImplementation(((dir: fs.PathLike, options?: fs.MakeDirectoryOptions) => {
            if (++calls <= 2) {
                throw busy('EPERM')
            }
            return mkdir(dir, options)
        }) as typeof fs.mkdirSync)
        try {
            expect(withFileLock(file, () => 'done')).toBe('done')
        } finally {
            spy.mockRestore()
        }
        expect(calls).toBe(3)
    })

    it('throws a permission error of the lock that stays', () => {
        const file = tempFile()
        const spy = vi.spyOn(fs, 'mkdirSync').mockImplementation(() => {
            throw busy('EACCES')
        })
        try {
            expect(() => withFileLock(file, () => 'done')).toThrow('EACCES')
        } finally {
            spy.mockRestore()
        }
    })

})

describe('writeFileAtomic', () => {
    const dirs: string[] = []
    afterEach(() => {
        vi.restoreAllMocks()
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })
    const tempFile = () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cjson-write-'))
        dirs.push(dir)
        return path.join(dir, 'feature.json')
    }

    it('tries the rename again when Windows still has the file open (EPERM, EBUSY)', () => {
        const file = tempFile()
        fs.writeFileSync(file, 'old')
        const rename = fs.renameSync
        let calls = 0
        vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
            calls++
            if (calls <= 2) {
                throw busy(calls === 1 ? 'EPERM' : 'EBUSY')
            }
            rename(from, to)
        })
        writeFileAtomic(file, 'new')
        expect(fs.readFileSync(file, 'utf-8')).toBe('new')
        expect(fs.readdirSync(path.dirname(file))).toEqual(['feature.json'])
    })

    it('writes the file directly when the rename keeps failing, and removes the temporary file', () => {
        const file = tempFile()
        fs.writeFileSync(file, 'old')
        vi.spyOn(fs, 'renameSync').mockImplementation(() => {
            throw busy('EPERM')
        })
        writeFileAtomic(file, 'new')
        expect(fs.readFileSync(file, 'utf-8')).toBe('new')
        expect(fs.readdirSync(path.dirname(file))).toEqual(['feature.json'])
    })

    it('throws other errors of the rename', () => {
        const file = tempFile()
        vi.spyOn(fs, 'renameSync').mockImplementation(() => {
            throw Object.assign(new Error('ENOSPC: no space left on device'), { code: 'ENOSPC' })
        })
        expect(() => writeFileAtomic(file, 'new')).toThrow('ENOSPC')
    })
})

describe('fileIdOf', () => {
    it('keeps a short id, without the characters that a file name cannot have', () => {
        expect(fileIdOf('login:-admin/user')).toBe('login--admin-user')
    })

    it('keeps a name that Windows keeps for a device away from it (also with an extension)', () => {
        for (const id of ['con', 'PRN', 'aux', 'nul', 'com1', 'lpt9', 'nul.test']) {
            expect(fileIdOf(id), id).toBe(`_${id}`)
        }
        for (const id of ['console', 'nul-feature', 'com10']) {
            expect(fileIdOf(id), id).toBe(id)
        }
    })

    it('cuts a long id between 2 characters and adds a hash of the full id', () => {
        const id = '漢字のテスト機能名称'.repeat(9)
        const fileId = fileIdOf(id)
        expect(Buffer.byteLength(fileId)).toBeLessThanOrEqual(200)
        // no character cut in its UTF-8 bytes
        expect(Buffer.from(fileId).toString()).toBe(fileId)
        expect(fileId).toMatch(/^漢字のテスト機能名称.*-[0-9a-f]{8}$/)
        // the workers of the same feature write the same file (reportFilePerRetry false)
        expect(fileIdOf(id)).toBe(fileId)
        // 2 features with the same start have 2 files
        expect(fileIdOf(`${id}-2`)).not.toBe(fileId)
    })
})
