import { describe, expect, it } from 'vitest'
import AdmZip from 'adm-zip'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FakeToolCallingModel } from 'langchain'
import { createDeepAgentHarness } from '../src/agent.js'
import { runDiagnosis } from '../src/heal/index.js'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const CONFIG = path.join(FIXTURES, 'wdio.conf.ts')
const FAKE_WDIO = path.join(FIXTURES, 'fake-wdio.mjs')
const MCP_SERVER = path.join(FIXTURES, 'mcp-server.mjs')

/** Failing trace: a click that errored. */
async function makeFailingTrace(dir: string): Promise<string> {
    const zip = new AdmZip()
    zip.addFile('trace.trace', Buffer.from([
        JSON.stringify({ type: 'context-options', url: 'https://example.com' }),
        JSON.stringify({ type: 'before', id: 'a1', ts: 1000, action: { name: 'url', value: 'https://example.com' } }),
        JSON.stringify({ type: 'after', id: 'a1', ts: 1200 }),
        JSON.stringify({ type: 'before', id: 'a2', ts: 1300, action: { name: 'click', selector: '#login-btn' } }),
        JSON.stringify({ type: 'after', id: 'a2', ts: 1300, error: 'element not found' }),
    ].join('\n')))
    zip.addFile('trace.network', Buffer.from(JSON.stringify({ method: 'GET', url: 'https://example.com/api', status: 500, duration: 10 }) + '\n'))
    zip.addFile('transcript.md', Buffer.from('# Trace\n- url https://example.com\n- click #login-btn failed\n'))
    const tracePath = path.join(dir, 'trace-failing.zip')
    await fs.writeFile(tracePath, zip.toBuffer())
    return tracePath
}

describe('runDiagnosis', () => {
    it('ingests a failing trace and reports failures without reproduction', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const report = await runDiagnosis({
            tracePath,
            traceDir: path.join(dir, 'traces'),
            heal: 'propose',
        })
        expect(report.source).toBe('trace-failing.zip')
        expect(report.failedActions).toHaveLength(1)
        expect(report.failedActions[0]).toMatchObject({ name: 'click', selector: '#login-btn' })
        expect(report.networkErrors).toHaveLength(1)
        expect(report.networkErrors[0].status).toBe(500)
        expect(report.reproduction).toBeUndefined()
        expect(report.agentRan).toBe(false)
        await fs.rm(dir, { recursive: true, force: true })
    })

    it('reproduces + diffs when spec + config are given', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const spec = path.join(FIXTURES, 'some.spec.js')
        const report = await runDiagnosis({
            tracePath,
            configPath: CONFIG,
            spec,
            traceDir: path.join(dir, 'traces'),
            heal: 'propose',
            spawnCommand: process.execPath,
            spawnArgs: [FAKE_WDIO, 'run', 'overlay.mjs', '--spec', spec],
        })
        expect(report.reproduction).toBeDefined()
        expect(report.reproduction!.exitCode).toBe(0)
        expect(report.diff).toBeDefined()
        expect(report.diff!.newActionCount).toBeGreaterThanOrEqual(0)
        await fs.rm(dir, { recursive: true, force: true })
        await fs.rm(path.join(FIXTURES, 'test-results'), { recursive: true, force: true })
    })

    it('propose mode never invokes the agent', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const harness = await createDeepAgentHarness({
            model: { provider: 'openai', model: 'fake' },
            modelOverride: new FakeToolCallingModel({ toolCalls: [], toolStyle: 'openai' }),
            mcp: { command: process.execPath, args: [MCP_SERVER] },
            traceDir: 'test-results',
            heal: 'propose',
        })
        try {
            const report = await runDiagnosis({
                tracePath,
                traceDir: path.join(dir, 'traces'),
                heal: 'propose',
                agent: harness.agent,
            })
            expect(report.agentRan).toBe(false)
        } finally {
            await harness.close()
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('ask mode invokes the agent for healing', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const harness = await createDeepAgentHarness({
            model: { provider: 'openai', model: 'fake' },
            modelOverride: new FakeToolCallingModel({ toolCalls: [], toolStyle: 'openai' }),
            mcp: { command: process.execPath, args: [MCP_SERVER] },
            traceDir: 'test-results',
            heal: 'ask',
        })
        try {
            const report = await runDiagnosis({
                tracePath,
                traceDir: path.join(dir, 'traces'),
                heal: 'ask',
                agent: harness.agent,
            })
            expect(report.agentRan).toBe(true)
            expect(typeof report.agentReply).toBe('string')
        } finally {
            await harness.close()
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('ask mode resumes interrupt-gated writes (auto-approve)', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const spec = path.join(dir, 'spec.js')
        await fs.writeFile(spec, 'original')
        const harness = await createDeepAgentHarness({
            model: { provider: 'openai', model: 'fake' },
            modelOverride: new FakeToolCallingModel({
                toolCalls: [[{ name: 'write_file', args: { path: spec, content: 'fixed' }, id: 'call-1' }]],
                toolStyle: 'openai',
            }),
            mcp: { command: process.execPath, args: [MCP_SERVER] },
            traceDir: 'test-results',
            heal: 'ask',
            projectRoot: dir,
        })
        try {
            const report = await runDiagnosis({
                tracePath,
                traceDir: path.join(dir, 'traces'),
                heal: 'ask',
                agent: harness.agent,
            })
            expect(report.agentRan).toBe(true)
            expect(typeof report.agentReply).toBe('string')
            expect(await fs.readFile(spec, 'utf8')).toBe('fixed')
        } finally {
            await harness.close()
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

    it('ask mode with a rejecting resolver skips the write', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const spec = path.join(dir, 'spec.js')
        await fs.writeFile(spec, 'original')
        const harness = await createDeepAgentHarness({
            model: { provider: 'openai', model: 'fake' },
            modelOverride: new FakeToolCallingModel({
                toolCalls: [[{ name: 'write_file', args: { path: spec, content: 'fixed' }, id: 'call-1' }]],
                toolStyle: 'openai',
            }),
            mcp: { command: process.execPath, args: [MCP_SERVER] },
            traceDir: 'test-results',
            heal: 'ask',
            projectRoot: dir,
        })
        try {
            const report = await runDiagnosis({
                tracePath,
                traceDir: path.join(dir, 'traces'),
                heal: 'ask',
                agent: harness.agent,
                resolveInterrupt: async () => false,
            })
            expect(report.agentRan).toBe(true)
            expect(await fs.readFile(spec, 'utf8')).toBe('original')
        } finally {
            await harness.close()
            await fs.rm(dir, { recursive: true, force: true })
        }
    })
})
