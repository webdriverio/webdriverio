import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'

import { FIXTURES, createProject, descendants, isAlive, readState, waitFor, type Project } from './helpers.js'

function pidsUsing (needle: string) {
    const found: number[] = []
    let entries: string[] = []
    try {
        entries = fs.readdirSync('/proc').filter((entry) => /^\d+$/.test(entry))
    } catch {
        return found
    }
    for (const entry of entries) {
        try {
            const cmd = fs.readFileSync(`/proc/${entry}/cmdline`, 'utf8')
            if (cmd.includes(needle)) {
                found.push(Number(entry))
            }
        } catch {
            // process gone
        }
    }
    return found
}

describe('wdio session electron', () => {
    let project: Project
    const app = path.join(FIXTURES, 'electron-app', 'main.js')

    const run = async (...args: string[]) => {
        const res = await project.run(args, { timeout: 120_000 })
        expect(res.code, `${args.join(' ')}\n${res.stderr}\n${res.stdout}`).toBe(0)
        return res
    }

    beforeAll(async () => {
        project = createProject('electron')
        const e2eModules = path.resolve(__dirname, '..', 'node_modules')
        const nm = path.join(project.dir, 'node_modules')
        fs.mkdirSync(path.join(nm, '.bin'), { recursive: true })
        fs.mkdirSync(path.join(nm, '@wdio'), { recursive: true })
        const electronPkg = fs.realpathSync(path.join(e2eModules, 'electron'))
        fs.symlinkSync(electronPkg, path.join(nm, 'electron'))
        /**
         * `@wdio/electron-service` launches `node_modules/.bin/electron`. The
         * published shim computes paths from `$0`, which breaks when that
         * path is a symlink, so this project gets a shim that execs the
         * real binary.
         */
        const bin = path.join(nm, '.bin', 'electron')
        fs.writeFileSync(bin, `#!/bin/sh\nexec ${JSON.stringify(path.join(electronPkg, 'dist', 'electron'))} "$@"\n`)
        fs.chmodSync(bin, 0o755)
        const visual = path.resolve(__dirname, '..', '..', 'packages', 'wdio-session', 'node_modules', '@wdio', 'visual-service')
        fs.symlinkSync(visual, path.join(nm, '@wdio', 'visual-service'))
        fs.writeFileSync(path.join(project.dir, 'package.json'), JSON.stringify({
            name: 'electron-session-e2e',
            private: true,
            dependencies: { electron: '44.4.5' }
        }))
        const opened = await project.run([
            'open', 'electron', app,
            // GitHub-hosted Linux rejects the Electron sandbox and exits Chrome immediately.
            '--app-arg=--no-sandbox',
            '--app-arg=--disable-dev-shm-usage'
        ], { timeout: 120_000 })
        expect(opened.code, `${opened.stderr}\n${opened.stdout}`).toBe(0)
    }, 150_000)

    afterAll(async () => {
        await project?.cleanup()
    })

    it('drives the fixture, compares it, and reads main-process logs', async () => {
        const info = await run('info')
        expect(info.stdout).toMatch(/platform\s+electron/)

        const snapshot = await run('snapshot', '--interactive')
        expect(snapshot.stdout).toContain('button "Increment"')
        const ref = snapshot.stdout.split('\n').find((line) => line.includes('button "Increment"'))?.match(/\[ref=(e\d+)\]/)?.[1]
        expect(ref).toBeTruthy()
        await run('click', ref!)
        await run('click', ref!)
        const count = await run('exec', '-e', 'await $("#count").getText()')
        expect(count.stdout.trim()).toBe('2')

        const name = await run('exec', '-e', 'await browser.electron.execute((electron) => electron.app.getName())')
        expect(name.stdout.trim()).toBe('session-fixture-app')

        await run('visual', 'save', 'app')
        const check = await run('visual', 'check', 'app')
        expect(check.stdout).toContain('mismatch 0.00%')

        const logs = await run('logs', '--source', 'main')
        expect(logs.stdout).toContain('main ready')

        const state = readState(project)
        const daemon = state.pid as number
        expect(descendants(daemon).length).toBeGreaterThan(0)
        await run('close')
        const gone = await waitFor(() => pidsUsing(app).filter(isAlive).length === 0, 15_000)
        expect(gone, `electron still running: ${pidsUsing(app).filter(isAlive).join(',')}`).toBe(true)
    }, 180_000)
})
