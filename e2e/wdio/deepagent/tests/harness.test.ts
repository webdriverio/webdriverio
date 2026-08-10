/**
 * Tier T1 — harness e2e, no browser, CI-always (E2E-01..07).
 *
 * Real harness (real filesystem backend, real MCP stdio server) driven by
 * a scripted fake model. Deterministic: no LLM, no external network.
 *
 * Documented deviations from docs/E2E.md (plan assumptions vs shipped
 * behavior, also noted in the plan doc's README):
 * - E2E-06: `runMission` exits 1 only when the turn throws (run.ts has no
 *   "FAILED:" text contract). A throwing model is swallowed by the agent
 *   loop (exit 0, tracked gap); a transport crash (fixture_crash exits the
 *   MCP server mid-call) throws the turn and surfaces as exit 1.
 * - E2E-05: auto mode has NO config-file deny rule — a root-scoped config
 *   write is allowed; the test asserts the real boundary.
 */
import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { HumanMessage, FakeToolCallingModel } from 'langchain'
import { Command } from '@langchain/langgraph'
import { createDeepAgentHarness } from '@wdio/deepagent/agent'
import { runMission } from '@wdio/deepagent/commands/run'
import { runDiagnosis } from '@wdio/deepagent/heal'
import { buildTraceZip } from '../fixtures/trace-builder.js'
import {
    FAKE_WDIO,
    MCP_SERVER,
    buildHarness,
    makeTempDir,
    rmrf,
    readCallLog,
} from '../helpers.js'

const nav = (url: string, id: string) => ({ name: 'fixture_navigate', args: { url }, id })
const title = (id: string, text: string) => ({ name: 'fixture_get_title', args: { title: text }, id })
const write = (filePath: string, content: string, id: string) => ({ name: 'write_file', args: { file_path: filePath, content }, id })
const edit = (filePath: string, oldString: string, newString: string, id: string) => ({ name: 'edit_file', args: { file_path: filePath, old_string: oldString, new_string: newString }, id })

const C = 60_000

describe('E2E-01 mission executes scripted traversal', () => {
    it('runs the exact scripted call order through a real MCP stdio server', async () => {
        const dir = await makeTempDir('e2e-01-')
        const log = path.join(dir, 'calls.jsonl')
        process.env.FIXTURE_LOG = log
        const harness = await buildHarness(
            [[nav('https://example.com', 'call-1')], [title('call-2', 'Fixture Title')], []],
            { projectRoot: dir },
        )
        try {
            const result = await runMission(harness.agent, 'explore the app')
            const calls = await readCallLog(log)
            expect(calls.map((c) => c.name)).toEqual(['fixture_navigate', 'fixture_get_title'])
            expect(calls[0].args).toEqual({ url: 'https://example.com' })
            // the fake model echoes the last tool result as its reply
            expect(result.reply).toContain('Fixture Title')
            expect(result.exitCode).toBe(0)
        } finally {
            await harness.close()
            delete process.env.FIXTURE_LOG
            await rmrf(dir)
        }
    }, C)
})

describe('E2E-02 fs toolchain + scope enforcement', () => {
    it('allows in-root writes, surfaces permission errors for outside-root writes', async () => {
        const dir = await makeTempDir('e2e-02-')
        const outsideFile = path.join(os.tmpdir(), `e2e-02-outside-${Date.now()}.txt`)
        const inRoot = path.join(dir, 'app.txt')
        const harness = await buildHarness(
            [
                [write(inRoot, 'project data', 'call-1')],
                [write(outsideFile, 'evil', 'call-2')],
                [{ name: 'execute', args: { command: 'id' }, id: 'call-3' }],
                [],
            ],
            { projectRoot: dir },
        )
        try {
            const result = await runMission(harness.agent, 'write files')
            expect(await fs.readFile(inRoot, 'utf8')).toBe('project data')
            // the denial surfaces to the agent as a tool error, not a crash
            expect(result.reply).toMatch(/permission denied/i)
            await expect(fs.access(outsideFile)).rejects.toThrow()
            // no shell hole: the fs backend is not a SandboxBackend, so the
            // execute tool is inert even though it is part of the surface
            expect(result.reply).toMatch(/execution not available/i)
            // no stray writes: only the intended in-root file exists
            expect(await fs.readdir(dir)).toEqual(['app.txt'])
        } finally {
            await harness.close()
            await rmrf(dir)
            await fs.rm(outsideFile, { force: true })
        }
    }, C)
})

describe('E2E-03 heal ask — interrupt gating', () => {
    it('fires the interrupt gate before edit_file, applies after approval', async () => {
        const dir = await makeTempDir('e2e-03-')
        const spec = path.join(dir, 'spec.js')
        await fs.writeFile(spec, 'old content\n')
        const tracePath = path.join(dir, 'trace.zip')
        await fs.writeFile(tracePath, buildTraceZip())
        const harness = await buildHarness(
            [[edit(spec, 'old content', 'new content', 'call-1')], []],
            { heal: 'ask', projectRoot: dir },
        )
        try {
            const report = await runDiagnosis({
                tracePath,
                configPath: path.join(dir, 'wdio.conf.ts'),
                spec,
                traceDir: path.join(dir, 'traces'),
                heal: 'ask',
                agent: harness.agent,
                spawnCommand: process.execPath,
                spawnArgs: [FAKE_WDIO, '--fail'],
            })
            // interrupt fired inside runDiagnosis: agent ran, report reflects
            // ask mode, file untouched (the gated edit_file paused)
            expect(report.heal).toBe('ask')
            expect(report.agentRan).toBe(true)
            expect(report.failedActions).toHaveLength(1)
            expect(await fs.readFile(spec, 'utf8'), 'no write before approval').toBe('old content\n')

            // approve the pending interrupt on the same thread → the edit executes
            await harness.agent.invoke(new Command({ resume: { decisions: [{ type: 'approve' }] } }))
            expect(await fs.readFile(spec, 'utf8'), 'write after approval').toBe('new content\n')
        } finally {
            await harness.close()
            await rmrf(dir)
        }
    }, C)
})

describe('E2E-04 heal propose — read-only', () => {
    it('denies writes, never runs the agent, emits the diff', async () => {
        const dir = await makeTempDir('e2e-04-')
        const spec = path.join(dir, 'spec.js')
        await fs.writeFile(spec, 'old content\n')
        const tracePath = path.join(dir, 'trace.zip')
        await fs.writeFile(tracePath, buildTraceZip())
        const harness = await buildHarness(
            [[edit(spec, 'old content', 'new content', 'call-1')], []],
            { heal: 'propose', projectRoot: dir },
        )
        try {
            // direct invocation: the denial surfaces to the agent, nothing written
            const run = await harness.agent.invoke({ messages: [new HumanMessage('fix the spec')] })
            const denial = run.messages
                .map((m: { content?: unknown }) => (typeof m.content === 'string' ? m.content : ''))
                .join('\n')
            expect(denial).toMatch(/permission denied/i)
            expect(await fs.readFile(spec, 'utf8')).toBe('old content\n')

            // full diagnose pipeline in propose mode: no agent, diff only
            const report = await runDiagnosis({
                tracePath,
                configPath: path.join(dir, 'wdio.conf.ts'),
                spec,
                traceDir: path.join(dir, 'traces'),
                heal: 'propose',
                agent: harness.agent,
                spawnCommand: process.execPath,
                spawnArgs: [FAKE_WDIO, '--fail'],
            })
            expect(report.agentRan).toBe(false)
            expect(report.diff).toBeDefined()
            const mtime = (await fs.stat(spec)).mtimeMs
            await new Promise((r) => setTimeout(r, 20))
            expect((await fs.stat(spec)).mtimeMs).toBe(mtime)
        } finally {
            await harness.close()
            await rmrf(dir)
        }
    }, C)
})

describe('E2E-05 heal auto — unattended', () => {
    it('applies the spec fix without interrupts; report reflects the auto heal', async () => {
        const dir = await makeTempDir('e2e-05-')
        const spec = path.join(dir, 'spec.js')
        await fs.writeFile(spec, 'old content\n')
        const tracePath = path.join(dir, 'trace.zip')
        await fs.writeFile(tracePath, buildTraceZip())
        const harness = await buildHarness(
            [[edit(spec, 'old content', 'new content', 'call-1')], []],
            { heal: 'auto', projectRoot: dir },
        )
        try {
            const report = await runDiagnosis({
                tracePath,
                configPath: path.join(dir, 'wdio.conf.ts'),
                spec,
                traceDir: path.join(dir, 'traces'),
                heal: 'auto',
                agent: harness.agent,
                spawnCommand: process.execPath,
                spawnArgs: [FAKE_WDIO, '--fail'],
            })
            expect(report.heal).toBe('auto')
            expect(report.agentRan).toBe(true)
            expect(await fs.readFile(spec, 'utf8')).toBe('new content\n')
            // exit-code contract: > 0 failed actions → exit 1 (index.ts)
            expect(report.failedActions.length).toBeGreaterThan(0)
        } finally {
            await harness.close()
            await rmrf(dir)
        }
    }, C)
})

describe('E2E-06 runMission exit-code contract', () => {
    it('exits 0 on a successful scripted run', async () => {
        const dir = await makeTempDir('e2e-06a-')
        const harness = await buildHarness([[nav('https://example.com', 'call-1')], []], { projectRoot: dir })
        try {
            const result = await runMission(harness.agent, 'go')
            expect(result.exitCode).toBe(0)
            expect(result.reply).toContain('fixture ok')
        } finally {
            await harness.close()
            await rmrf(dir)
        }
    }, C)

    it('a model that throws still exits 0 (deepagents swallows model errors, tracked in E2E.md)', async () => {
        const dir = await makeTempDir('e2e-06b-')
        // A model that throws is converted to reply content by the agent
        // loop (deepagents 1.12.2), so no throw surfaces and the reply is
        // non-empty junk — indistinguishable from success at this level.
        // runMission exits 1 for empty replies, failed tool invocations
        // and throws; the swallowed-error case remains exit 0.
        class ThrowingModel extends FakeToolCallingModel {
            override async _generate() {
                throw new Error('provider timeout')
            }
        }
        const harness = await createDeepAgentHarness({
            model: { provider: 'openai', model: 'fake' },
            modelOverride: new ThrowingModel({ toolCalls: [[]], toolStyle: 'openai' }),
            mcp: { command: process.execPath, args: [MCP_SERVER] },
            traceDir: 'test-results',
            projectRoot: dir,
        })
        try {
            const result = await runMission(harness.agent, 'go')
            expect(result.exitCode).toBe(0)
        } finally {
            await harness.close()
            await rmrf(dir)
        }
    }, C)

    it('a transport crash mid-call throws the turn and surfaces as exit 1', async () => {
        // fixture_crash makes the MCP server process.exit(1) mid-call — the
        // tool invocation fails hard (unlike model errors, which the agent
        // loop swallows), so runMission's exit-1 branch is reachable here.
        const dir = await makeTempDir('e2e-06c-')
        const harness = await buildHarness(
            [[{ name: 'fixture_crash', args: {}, id: 'call-1' }], []],
            { projectRoot: dir },
        )
        try {
            const result = await runMission(harness.agent, 'go')
            expect(result.exitCode).toBe(1)
        } finally {
            await harness.close()
            await rmrf(dir)
        }
    }, C)
})

describe('E2E-07 multi-turn memory', () => {
    it('persists conversation + todo state across turns on one thread', async () => {
        const dir = await makeTempDir('e2e-07-')
        const todos = (content: string, id: string) => ({
            name: 'write_todos',
            args: { todos: [{ content, status: 'in_progress' }] },
            id,
        })
        const harness = await buildHarness(
            [[todos('task-A', 'call-1')], [todos('task-B', 'call-2')], []],
            { projectRoot: dir },
        )
        try {
            const r1 = await harness.agent.invoke({ messages: [new HumanMessage('plan it')] })
            const r2 = await harness.agent.invoke({ messages: [new HumanMessage('revise it')] })
            const text = (m: { content?: unknown }) => (typeof m.content === 'string' ? m.content : '')
            const r1Tool = r1.messages.filter((m: { tool_call_id?: string }) => m.tool_call_id === 'call-1').map(text).join('\n')
            const r2Tool = r2.messages.filter((m: { tool_call_id?: string }) => m.tool_call_id === 'call-1' || m.tool_call_id === 'call-2').map(text).join('\n')
            expect(r1Tool).toContain('task-A')
            // turn 2 runs on the same thread: full history from turn 1 is visible
            expect(r2.messages.length).toBeGreaterThan(r1.messages.length)
            expect(r2Tool).toContain('task-A')
            expect(r2Tool).toContain('task-B')
        } finally {
            await harness.close()
            await rmrf(dir)
        }
    }, C)
})

describe('E2E-07b heal without MCP (mcp: null)', () => {
    it('heals the spec from the trace transcript + fs tools only', async () => {
        const dir = await makeTempDir('e2e-07b-')
        const spec = path.join(dir, 'spec.js')
        await fs.writeFile(spec, 'old content\n')
        const tracePath = path.join(dir, 'trace.zip')
        await fs.writeFile(tracePath, buildTraceZip())
        const harness = await buildHarness(
            [[edit(spec, 'old content', 'new content', 'call-1')], []],
            { heal: 'auto', projectRoot: dir, mcp: null },
        )
        try {
            // direct proof the null branch shorted out the MCP client
            expect(harness.mcpClient).toBeNull()
            const report = await runDiagnosis({
                tracePath,
                configPath: path.join(dir, 'wdio.conf.ts'),
                spec,
                traceDir: path.join(dir, 'traces'),
                heal: 'auto',
                agent: harness.agent,
                spawnCommand: process.execPath,
                spawnArgs: [FAKE_WDIO, '--fail'],
            })
            expect(report.agentRan).toBe(true)
            expect(await fs.readFile(spec, 'utf8')).toBe('new content\n')
            expect(report.failedActions.length).toBeGreaterThan(0)
        } finally {
            await harness.close()
            await rmrf(dir)
        }
    }, C)
})
