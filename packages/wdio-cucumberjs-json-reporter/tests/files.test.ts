import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { describe, it, expect, afterEach } from 'vitest'

import { withFileLock } from '../src/files.js'

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
})
