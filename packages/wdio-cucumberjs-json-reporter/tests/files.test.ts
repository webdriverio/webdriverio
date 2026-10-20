import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { describe, it, expect, afterEach } from 'vitest'

import { isLeft, withFileLock } from '../src/files.js'

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
