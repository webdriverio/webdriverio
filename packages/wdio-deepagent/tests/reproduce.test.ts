import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildTraceOverlay, reproduceSpec } from '../src/trace/index.js'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const CONFIG = path.join(FIXTURES, 'wdio.conf.ts')
const FAKE_WDIO = path.join(FIXTURES, 'fake-wdio.mjs')

describe('buildTraceOverlay', () => {
    it('appends the devtools trace service and sets the trace output dir', () => {
        const overlay = buildTraceOverlay(CONFIG, 'traces')
        expect(overlay).toContain('mode: \'trace\'')
        expect(overlay).toContain('traceFormat: \'zip\'')
        expect(overlay).toContain('outputDir')
        // `buildTraceOverlay` embeds the config path via `JSON.stringify`, so the
        // assertion must compare against the stringified form (backslashes are
        // escaped on Windows, which a bare `path.resolve` would not match).
        expect(overlay).toContain(JSON.stringify(path.resolve(CONFIG)))
    })
})

describe('reproduceSpec', () => {
    it('spawns wdio run under the overlay and returns the fresh trace artifact', async () => {
        const traceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-trace-'))
        const spec = path.join(FIXTURES, 'some.spec.js')
        const result = await reproduceSpec({
            configPath: CONFIG,
            spec,
            traceDir,
            spawnCommand: process.execPath,
            spawnArgs: [FAKE_WDIO, 'run', 'overlay.mjs', '--spec', spec],
        })

        expect(result.exitCode).toBe(0)
        // fake-wdio writes into the run-scoped trace dir passed via env;
        // cwd = project root (fixtures dir)
        expect(result.artifactPath).toContain(traceDir)
        expect(result.artifactPath).toMatch(/trace-.+\.zip$/)
        expect(result.duration).toBeGreaterThanOrEqual(0)

        await fs.rm(traceDir, { recursive: true, force: true })
    })

    it('reports a non-zero exit code when the run fails', async () => {
        const traceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-trace-'))
        const spec = path.join(FIXTURES, 'failing.spec.js')
        const result = await reproduceSpec({
            configPath: CONFIG,
            spec,
            traceDir,
            spawnCommand: process.execPath,
            spawnArgs: [FAKE_WDIO, '--fail', 'run', 'overlay.mjs', '--spec', spec],
        })

        expect(result.exitCode).toBe(1)
        expect(result.artifactPath).toBeDefined()

        await fs.rm(traceDir, { recursive: true, force: true })
        await fs.rm(path.join(FIXTURES, 'test-results'), { recursive: true, force: true })
    })

    it('ignores a concurrent run\'s zip in the shared test-results dir', async () => {
        const traceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-trace-'))
        // simulate a concurrent WDIO run writing a newer zip into the shared dir
        const shared = path.join(FIXTURES, 'test-results')
        await fs.mkdir(shared, { recursive: true })
        const foreign = path.join(shared, `trace-${Date.now()}.zip`)
        await fs.writeFile(foreign, Buffer.from('foreign'))
        try {
            const spec = path.join(FIXTURES, 'some.spec.js')
            const result = await reproduceSpec({
                configPath: CONFIG,
                spec,
                traceDir,
                spawnCommand: process.execPath,
                spawnArgs: [FAKE_WDIO, 'run', 'overlay.mjs', '--spec', spec],
            })

            expect(result.artifactPath).toBeDefined()
            expect(result.artifactPath).not.toContain('test-results')
            expect(result.artifactPath).toContain(traceDir)
            expect(result.artifactPath).toMatch(/trace-.+\.zip$/)
        } finally {
            await fs.rm(traceDir, { recursive: true, force: true })
            await fs.rm(shared, { recursive: true, force: true })
        }
    })

    it.skipIf(process.platform === 'win32')('falls back to npx when the local wdio bin is missing, passing args unshelled', async () => {
        const traceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-trace-'))
        const fakeBin = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-npx-bin-'))
        const argsFile = path.join(traceDir, 'npx-args.json')
        try {
            // fake `npx` first in PATH records the args it received (a shell
            // would have swallowed the quoted spec path and metacharacters)
            const npx = path.join(fakeBin, 'npx')
            await fs.writeFile(npx,
                '#!/usr/bin/env node\n' +
                'require(\'node:fs\').writeFileSync(process.env.WDIO_NPX_ARGS_FILE, JSON.stringify(process.argv.slice(1)))\n',
                { mode: 0o755 })
            const spec = path.join(FIXTURES, 'some.spec.js')
            const result = await reproduceSpec({
                configPath: CONFIG,
                spec,
                traceDir,
                env: { PATH: `${fakeBin}${path.delimiter}${process.env.PATH ?? ''}`, WDIO_NPX_ARGS_FILE: argsFile },
            })

            expect(result.exitCode).toBe(0)
            const argv = JSON.parse(await fs.readFile(argsFile, 'utf8'))
            expect(argv[1]).toBe('wdio')
            expect(argv[2]).toBe('run')
            expect(argv[argv.length - 2]).toBe('--spec')
            expect(argv[argv.length - 1]).toBe(spec)
        } finally {
            await fs.rm(traceDir, { recursive: true, force: true })
            await fs.rm(fakeBin, { recursive: true, force: true })
        }
    })

    it('refuses a spec that resolves outside the project root', async () => {
        const traceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-trace-'))
        try {
            await expect(reproduceSpec({
                configPath: CONFIG,
                spec: path.join(os.tmpdir(), 'elsewhere.spec.js'),
                traceDir,
                spawnCommand: process.execPath,
                spawnArgs: [FAKE_WDIO, 'run'],
            })).rejects.toThrow(/outside the project root/)
        } finally {
            await fs.rm(traceDir, { recursive: true, force: true })
        }
    })

    it('kills a hung run after the timeout and reports the timeout exit code', async () => {
        const traceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-trace-'))
        try {
            const started = Date.now()
            const result = await reproduceSpec({
                configPath: CONFIG,
                spec: path.join(FIXTURES, 'some.spec.js'),
                traceDir,
                timeoutMs: 250,
                spawnCommand: process.execPath,
                spawnArgs: ['-e', 'setTimeout(() => {}, 120000)'],
            })

            expect(result.exitCode).toBe(124)
            expect(result.stderr).toMatch(/timed out after 250 ms/)
            // resolved promptly, not after the child's 2-minute sleep
            expect(Date.now() - started).toBeLessThan(10_000)
        } finally {
            await fs.rm(traceDir, { recursive: true, force: true })
        }
    })

    it('forwards a parent SIGINT to the spawned run', async () => {
        const traceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-trace-'))
        try {
            const started = Date.now()
            const promise = reproduceSpec({
                configPath: CONFIG,
                spec: path.join(FIXTURES, 'some.spec.js'),
                traceDir,
                spawnCommand: process.execPath,
                spawnArgs: ['-e', 'setTimeout(() => {}, 120000)'],
            })
            setTimeout(() => process.emit('SIGINT'), 150)
            const result = await promise

            // killed by the forwarded SIGTERM, not the timeout path
            expect(result.stderr).not.toMatch(/timed out/)
            expect(Date.now() - started).toBeLessThan(10_000)
        } finally {
            await fs.rm(traceDir, { recursive: true, force: true })
        }
    })

    it('kills the process group so orphaned workers die with the timed-out run', async () => {
        const traceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-trace-'))
        const pidFile = path.join(traceDir, 'worker.pid')
        // Parent spawns a non-detached grandchild (same process group, like
        // wdio workers/browser) and stays alive so the timeout path fires;
        // the group kill must take the grandchild down with it.
        const script = `
            const { spawn } = require('node:child_process')
            const fs = require('node:fs')
            const child = spawn(process.execPath, ['-e', 'setTimeout(() => {}, 120000)'], { stdio: 'ignore' })
            fs.writeFileSync(${JSON.stringify(pidFile)}, String(child.pid))
            setTimeout(() => {}, 120000)
        `
        try {
            await reproduceSpec({
                configPath: CONFIG,
                spec: path.join(FIXTURES, 'some.spec.js'),
                traceDir,
                timeoutMs: 250,
                spawnCommand: process.execPath,
                spawnArgs: ['-e', script],
            })

            const pid = Number(await fs.readFile(pidFile, 'utf8'))
            const deadline = Date.now() + 1500
            while (Date.now() < deadline) {
                try {
                    process.kill(pid, 0)
                } catch {
                    break // ESRCH: process is gone
                }
                await new Promise((r) => setTimeout(r, 100))
            }
            expect(() => process.kill(pid, 0)).toThrow()
        } finally {
            await fs.rm(traceDir, { recursive: true, force: true })
        }
    })
})
