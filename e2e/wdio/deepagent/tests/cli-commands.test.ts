/**
 * Tier T3 — CLI process e2e (E2E-12..16).
 *
 * Spawns the real `wdio-deepagent` bin (built package) with a controlled
 * env in a temp cwd. Deterministic: exit codes + stdout/stderr assertions,
 * hard timeouts. The real-model CLI run (E2E-17 in the plan) lives in the
 * manual T0 tier (T0-03) — no fake-model env hook in the product.
 */
import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import { buildTraceZip } from '../fixtures/trace-builder.js'
import {
    DEEPAGENT_BIN,
    makeTempDir,
    rmrf,
    spawnProcess,
} from '../helpers.js'

function runCli(args: string[], opts: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) {
    return spawnProcess(process.execPath, [DEEPAGENT_BIN, ...args], {
        cwd: opts.cwd,
        env: opts.env,
        timeoutMs: 60_000,
    })
}

describe('E2E-12 help', () => {
    it('exits 0 and lists every command in the usage', async () => {
        const res = await runCli(['help'])
        expect(res.code).toBe(0)
        expect(res.timedOut).toBe(false)
        for (const cmd of ['repl', 'run', 'init', 'diagnose', 'mcp']) {
            expect(res.stdout).toContain(cmd)
        }
    })
})

describe('E2E-13 unknown command', () => {
    it('exits 1 with an Unknown command error on stderr', async () => {
        const res = await runCli(['bogus'])
        expect(res.code).toBe(1)
        expect(res.stderr).toContain('Unknown command')
    })
})

describe('E2E-14 run without a model', () => {
    it('exits 1 with the BYOK hint and returns quickly (no hang)', async () => {
        const dir = await makeTempDir('t3-nomodel-')
        try {
            const res = await runCli(['run', 'x'], { cwd: dir })
            expect(res.code).toBe(1)
            expect(res.timedOut).toBe(false)
            expect(res.stderr).toContain('No model configured')
            expect(res.stderr).toContain('DEEPAGENT_MODEL')
        } finally {
            await rmrf(dir)
        }
    })
})

describe('E2E-15 init non-TTY regression', () => {
    it('rejects piped stdin with the interactive-terminal error, writes nothing', async () => {
        const dir = await makeTempDir('t3-init-')
        try {
            const res = await runCli(['init'], { cwd: dir })
            expect(res.code).toBe(1)
            expect(res.stderr).toContain('interactive terminal')
            expect(await fs.readdir(dir)).toEqual([])
        } finally {
            await rmrf(dir)
        }
    })
})

describe('E2E-16 diagnose --heal propose ingest-only', () => {
    it('ingests the trace read-only: agentRan false, no files touched', async () => {
        const dir = await makeTempDir('t3-dx-')
        try {
            const tracePath = path.join(dir, 'trace.zip')
            await fs.writeFile(tracePath, buildTraceZip())
            const res = await runCli(['diagnose', tracePath, '--heal', 'propose'], { cwd: dir })
            // exit-code contract (index.ts): failedActions > 0 → exit 1
            expect(res.code).toBe(1)
            const report = JSON.parse(res.stdout)
            expect(report.agentRan).toBe(false)
            expect(report.actionCount).toBeGreaterThan(0)
            expect(report.failedActions).toBe(1)
            expect(report.heal).toBe('propose')
            // nothing was written anywhere in the cwd
            expect(await fs.readdir(dir)).toEqual(['trace.zip'])
        } finally {
            await rmrf(dir)
        }
    })
})

describe('E2E-16b diagnose with mcp: null config', () => {
    it('parses mcp: null from wdio.conf and runs propose diagnose (no MCP spawn)', async () => {
        const dir = await makeTempDir('t3-mcpnull-')
        try {
            await fs.writeFile(path.join(dir, 'wdio.conf.ts'),
                'export const config = { specs: [], capabilities: {}, deepagent: { mcp: null } }\n')
            const tracePath = path.join(dir, 'trace.zip')
            await fs.writeFile(tracePath, buildTraceZip())
            const res = await runCli(['diagnose', tracePath, '--heal', 'propose'], { cwd: dir })
            // failing trace → exit mirrors failedActions (same contract as E2E-16)
            expect(res.code).toBe(1)
            const report = JSON.parse(res.stdout)
            expect(report.failedActions).toBe(1)
            expect(report.agentRan).toBe(false)
            // config parsed: null mcp accepted; silent config-load failure
            // (warn on stderr) would default mcp back to an object
            expect(res.stderr).not.toContain('Failed to load deepagent block')
            expect(report.heal).toBe('propose')
        } finally {
            await rmrf(dir)
        }
    })
})
