import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { describe, it, expect, afterEach, vi } from 'vitest'

import { fileIdOf, isLeft, withFileLock, writeFileAtomic } from '../src/files.js'

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

    it('does not take the lock of a worker that still writes, also after a long wait', async () => {
        const file = tempFile()
        const lock = `${file}.lock`
        // another worker holds the lock for 300 ms (more than the wait limit of 100 ms)
        const other = spawn(process.execPath, ['-e', `
            const fs = require('node:fs')
            fs.mkdirSync(${JSON.stringify(lock)})
            fs.writeFileSync(${JSON.stringify(path.join(lock, 'pid'))}, String(process.pid))
            console.log('locked')
            setTimeout(() => {
                fs.writeFileSync(${JSON.stringify(file)}, 'other')
                fs.rmSync(${JSON.stringify(lock)}, { recursive: true })
            }, 300)
        `])
        const exited = new Promise((resolve) => other.once('exit', resolve))
        await new Promise((resolve) => other.stdout.once('data', resolve))
        const seen = withFileLock(file, () => fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : 'no file', 100)
        await exited
        // the action ran after the other worker wrote its file
        expect(seen).toBe('other')
    })

    it('takes the lock of a worker that ended without removing it', () => {
        const file = tempFile()
        const lock = `${file}.lock`
        fs.mkdirSync(lock)
        // a process id that does not run
        fs.writeFileSync(path.join(lock, 'pid'), '2147483646')
        const start = Date.now()
        expect(withFileLock(file, () => 'done', 5000)).toBe('done')
        expect(Date.now() - start).toBeLessThan(1000)
        expect(fs.existsSync(lock)).toBe(false)
    })

    it('does not take a new lock with no process id, also after a long wait for an earlier lock', async () => {
        const file = tempFile()
        const lock = `${file}.lock`
        // worker 1 holds the lock for 1500 ms; then the lock has no process id for 300 ms, as a
        // new lock of worker 2 between its mkdir and its pid write (removing the pid file
        // starts the age of the folder again, with no moment where the lock is free)
        const other = spawn(process.execPath, ['-e', `
            const fs = require('node:fs')
            const pid = ${JSON.stringify(path.join(lock, 'pid'))}
            fs.mkdirSync(${JSON.stringify(lock)})
            fs.writeFileSync(pid, String(process.pid))
            console.log('locked')
            setTimeout(() => {
                fs.rmSync(pid)
                setTimeout(() => {
                    fs.writeFileSync(${JSON.stringify(file)}, 'worker 2')
                    fs.rmSync(${JSON.stringify(lock)}, { recursive: true })
                }, 300)
            }, 1500)
        `])
        const exited = new Promise((resolve) => other.once('exit', resolve))
        await new Promise((resolve) => other.stdout.once('data', resolve))
        // the limit (1000 ms) is shorter than the wait, but longer than the age of the new lock
        const seen = withFileLock(file, () => fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : 'no file', 1000)
        await exited
        expect(seen).toBe('worker 2')
    })

    it('takes an old lock whose process id runs (the id is used again, for example in a new container)', () => {
        const file = tempFile()
        const lock = `${file}.lock`
        fs.mkdirSync(lock)
        // the process id of this test runs
        fs.writeFileSync(path.join(lock, 'pid'), String(process.pid))
        const old = new Date(Date.now() - 120_000)
        fs.utimesSync(lock, old, old)
        const start = Date.now()
        expect(withFileLock(file, () => 'done', 10_000, 60_000)).toBe('done')
        expect(Date.now() - start).toBeLessThan(1000)
    })

    it.skipIf(process.platform === 'win32')('takes a lock path that is a broken symbolic link after the limit (no busy loop)', () => {
        const file = tempFile()
        const lock = `${file}.lock`
        // mkdir fails with EEXIST, and stat of the link target fails
        fs.symlinkSync(path.join(path.dirname(file), 'missing-target'), lock)
        expect(withFileLock(file, () => 'done', 100)).toBe('done')
        expect(fs.existsSync(lock)).toBe(false)
    })

    it('does not know the owner of a lock with an empty or invalid process id (it can time out)', () => {
        const lock = `${tempFile()}.lock`
        fs.mkdirSync(lock)
        for (const pid of ['', '0', 'abc', '-1']) {
            fs.writeFileSync(path.join(lock, 'pid'), pid)
            // process.kill(0, 0) checks the process group of this process: it does not throw
            expect(isLeft(lock), `pid "${pid}"`).toBeUndefined()
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
    const busy = (code: string) => Object.assign(new Error(`${code}: resource busy or locked`), { code })

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
