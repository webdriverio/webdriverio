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
        expect(overlay).toContain(path.resolve(CONFIG))
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
        // fake-wdio writes into <cwd>/test-results; cwd = project root (fixtures dir)
        expect(result.artifactPath).toContain(path.join(FIXTURES, 'test-results'))
        expect(result.artifactPath).toMatch(/trace-.+\.zip$/)
        expect(result.duration).toBeGreaterThanOrEqual(0)

        await fs.rm(traceDir, { recursive: true, force: true })
        await fs.rm(path.join(FIXTURES, 'test-results'), { recursive: true, force: true })
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
