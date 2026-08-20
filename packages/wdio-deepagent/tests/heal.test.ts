import { describe, expect, it } from 'vitest'
import AdmZip from 'adm-zip'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { FakeToolCallingModel } from 'langchain'
import { createDeepAgentHarness } from '../src/agent.js'
import { runDiagnosis } from '../src/heal/index.js'
import { DEFAULT_MAX_TRACE_BYTES } from '../src/trace/reader.js'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const CONFIG = path.join(FIXTURES, 'wdio.conf.ts')
const FAKE_WDIO = path.join(FIXTURES, 'fake-wdio.mjs')
const MCP_SERVER = path.join(FIXTURES, 'mcp-server.mjs')
const FAKE_MODEL = { provider: 'openai', model: 'fake', temperature: 0.1, maxTokens: 8192 } as const

/** A trace.network line in the real @wdio/devtools-service HAR shape. */
function networkRecord(method: string, url: string, status: number, time = 0): string {
    return JSON.stringify({
        type: 'resource-snapshot',
        snapshot: {
            startedDateTime: '2026-08-20T18:50:03.690Z',
            time,
            request: { method, url, headers: [], httpVersion: 'HTTP/1.1' },
            response: { status, statusText: status >= 400 ? 'Error' : 'OK', headers: [] },
            timings: { send: 0, wait: time, receive: 0 },
        },
    })
}

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
    zip.addFile('trace.network', Buffer.from(networkRecord('GET', 'https://example.com/api', 500, 10) + '\n'))
    zip.addFile('transcript.md', Buffer.from('# Trace\n- url https://example.com\n- click #login-btn failed\n'))
    const tracePath = path.join(dir, 'trace-failing.zip')
    await fs.writeFile(tracePath, zip.toBuffer())
    return tracePath
}

/** Fake spec runner that records each invocation and mimics fake-wdio's trace zip + exit code. */
const RUNNER_SCRIPT = `import fs from 'node:fs'
import path from 'node:path'
const out = process.env.WDIO_DEEPAGENT_TRACE_DIR || path.join(process.cwd(), 'test-results')
fs.mkdirSync(out, { recursive: true })
fs.appendFileSync(process.argv[process.argv.indexOf('--log') + 1], 'run\\n')
const emptyZip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x05, 0x06]), Buffer.alloc(18)])
fs.writeFileSync(path.join(out, 'trace-' + Date.now() + '.zip'), emptyZip)
process.exit(process.argv.includes('--fail') ? 1 : 0)
`

/** Writes the counting runner into `dir` and returns its spawn args plus the run log. */
async function makeRunner(dir: string) {
    const spec = path.join(FIXTURES, 'some.spec.js')
    const runner = path.join(dir, 'fake-runner.mjs')
    const logPath = path.join(dir, 'runs.log')
    await fs.writeFile(runner, RUNNER_SCRIPT)
    return { logPath, spec, spawnArgs: [runner, 'run', 'overlay.mjs', '--spec', spec, '--log', logPath] }
}

/** RUNNER_SCRIPT variant: fails the first `--fail-first N` invocations (counted via its own log), then succeeds. */
const FLAKY_RUNNER_SCRIPT = `import fs from 'node:fs'
import path from 'node:path'
const out = process.env.WDIO_DEEPAGENT_TRACE_DIR || path.join(process.cwd(), 'test-results')
fs.mkdirSync(out, { recursive: true })
const logPath = process.argv[process.argv.indexOf('--log') + 1]
const invocation = (fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf8').split('\\n').filter(Boolean).length : 0) + 1
fs.appendFileSync(logPath, 'run\\n')
const emptyZip = Buffer.concat([Buffer.from([0x50, 0x4b, 0x05, 0x06]), Buffer.alloc(18)])
fs.writeFileSync(path.join(out, 'trace-' + Date.now() + '.zip'), emptyZip)
process.exit(invocation <= Number(process.argv[process.argv.indexOf('--fail-first') + 1]) ? 1 : 0)
`

/** Like makeRunner, but exits 1 for the first `failFirst` invocations and 0 afterwards. */
async function makeFlakyRunner(dir: string, failFirst: number) {
    const spec = path.join(FIXTURES, 'some.spec.js')
    const runner = path.join(dir, 'fake-runner.mjs')
    const logPath = path.join(dir, 'runs.log')
    await fs.writeFile(runner, FLAKY_RUNNER_SCRIPT)
    return { logPath, spec, spawnArgs: [runner, 'run', 'overlay.mjs', '--spec', spec, '--log', logPath, '--fail-first', String(failFirst)] }
}

async function countRuns(logPath: string): Promise<number> {
    return (await fs.readFile(logPath, 'utf8')).split('\n').filter(Boolean).length
}

async function makeAskHarness() {
    return createDeepAgentHarness({
        model: FAKE_MODEL,
        modelOverride: new FakeToolCallingModel({ toolCalls: [], toolStyle: 'openai' }),
        mcp: { command: process.execPath, args: [MCP_SERVER] },
        traceDir: 'test-results',
        heal: 'ask',
    })
}

describe('runDiagnosis', () => {
    it('rejects an oversize trace before reading it', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = path.join(dir, 'huge-trace.zip')
        // sparse file: sized past the cap without writing 256MB
        const fh = await fs.open(tracePath, 'w')
        await fh.truncate(DEFAULT_MAX_TRACE_BYTES + 1)
        await fh.close()
        try {
            await expect(runDiagnosis({
                tracePath,
                traceDir: path.join(dir, 'traces'),
                heal: 'propose',
            })).rejects.toThrow(/exceeds the .* byte cap/)
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })

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
            model: FAKE_MODEL,
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
            model: FAKE_MODEL,
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
            model: FAKE_MODEL,
            modelOverride: new FakeToolCallingModel({
                toolCalls: [[{ name: 'write_file', args: { path: '/spec.js', content: 'fixed' }, id: 'call-1' }]],
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
            model: FAKE_MODEL,
            modelOverride: new FakeToolCallingModel({
                toolCalls: [[{ name: 'write_file', args: { path: '/spec.js', content: 'fixed' }, id: 'call-1' }]],
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

    it('ask mode reruns the spec after healing and reports a green verification', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const { logPath, spec, spawnArgs } = await makeRunner(dir)
        const harness = await makeAskHarness()
        try {
            const report = await runDiagnosis({
                tracePath,
                configPath: CONFIG,
                spec,
                traceDir: path.join(dir, 'traces'),
                heal: 'ask',
                agent: harness.agent,
                spawnCommand: process.execPath,
                spawnArgs,
            })
            expect(report.agentRan).toBe(true)
            expect(report.verification).toBeDefined()
            expect(report.verification!.healed).toBe(true)
            expect(report.verification!.exitCode).toBe(0)
            expect(await countRuns(logPath)).toBe(2)
        } finally {
            await harness.close()
            await fs.rm(dir, { recursive: true, force: true })
            await fs.rm(path.join(FIXTURES, 'test-results'), { recursive: true, force: true })
        }
    })

    it('ask mode reports a failed verification when the heal did not fix the spec', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const { logPath, spec, spawnArgs } = await makeRunner(dir)
        const harness = await makeAskHarness()
        try {
            const report = await runDiagnosis({
                tracePath,
                configPath: CONFIG,
                spec,
                traceDir: path.join(dir, 'traces'),
                heal: 'ask',
                agent: harness.agent,
                // pins the single-attempt path this test has always covered;
                // the default of 2 is exercised by the cap test below
                maxHealAttempts: 1,
                spawnCommand: process.execPath,
                spawnArgs: [...spawnArgs, '--fail'],
            })
            expect(report.verification).toBeDefined()
            expect(report.verification!.healed).toBe(false)
            expect(report.verification!.exitCode).toBe(1)
            expect(await countRuns(logPath)).toBe(2)
        } finally {
            await harness.close()
            await fs.rm(dir, { recursive: true, force: true })
            await fs.rm(path.join(FIXTURES, 'test-results'), { recursive: true, force: true })
        }
    })

    it('ask mode heals on a retry when the first fix attempt still fails', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const { logPath, spec, spawnArgs } = await makeFlakyRunner(dir, 2)
        const harness = await makeAskHarness()
        try {
            const report = await runDiagnosis({
                tracePath,
                configPath: CONFIG,
                spec,
                traceDir: path.join(dir, 'traces'),
                heal: 'ask',
                agent: harness.agent,
                spawnCommand: process.execPath,
                spawnArgs,
            })
            expect(report.healAttempts).toBe(2)
            expect(report.verification).toBeDefined()
            expect(report.verification!.healed).toBe(true)
            expect(report.verification!.exitCode).toBe(0)
            expect(await countRuns(logPath)).toBe(3)
        } finally {
            await harness.close()
            await fs.rm(dir, { recursive: true, force: true })
            await fs.rm(path.join(FIXTURES, 'test-results'), { recursive: true, force: true })
        }
    })

    it('ask mode caps heal attempts at maxHealAttempts', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const { logPath, spec, spawnArgs } = await makeFlakyRunner(dir, Infinity)
        const harness = await makeAskHarness()
        try {
            const report = await runDiagnosis({
                tracePath,
                configPath: CONFIG,
                spec,
                traceDir: path.join(dir, 'traces'),
                heal: 'ask',
                agent: harness.agent,
                spawnCommand: process.execPath,
                spawnArgs,
                maxHealAttempts: 2,
            })
            expect(report.healAttempts).toBe(2)
            expect(report.verification).toBeDefined()
            expect(report.verification!.healed).toBe(false)
            expect(await countRuns(logPath)).toBe(3)
        } finally {
            await harness.close()
            await fs.rm(dir, { recursive: true, force: true })
            await fs.rm(path.join(FIXTURES, 'test-results'), { recursive: true, force: true })
        }
    })

    it('ask mode with maxHealAttempts 1 keeps the single-shot behaviour', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const { logPath, spec, spawnArgs } = await makeFlakyRunner(dir, Infinity)
        const harness = await makeAskHarness()
        try {
            const report = await runDiagnosis({
                tracePath,
                configPath: CONFIG,
                spec,
                traceDir: path.join(dir, 'traces'),
                heal: 'ask',
                agent: harness.agent,
                spawnCommand: process.execPath,
                spawnArgs,
                maxHealAttempts: 1,
            })
            expect(report.healAttempts).toBe(1)
            expect(report.verification).toBeDefined()
            expect(report.verification!.healed).toBe(false)
            expect(await countRuns(logPath)).toBe(2)
        } finally {
            await harness.close()
            await fs.rm(dir, { recursive: true, force: true })
            await fs.rm(path.join(FIXTURES, 'test-results'), { recursive: true, force: true })
        }
    })

    it('ask mode stops after one heal attempt when the fix succeeds first time', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const { logPath, spec, spawnArgs } = await makeFlakyRunner(dir, 0)
        const harness = await makeAskHarness()
        try {
            const report = await runDiagnosis({
                tracePath,
                configPath: CONFIG,
                spec,
                traceDir: path.join(dir, 'traces'),
                heal: 'ask',
                agent: harness.agent,
                spawnCommand: process.execPath,
                spawnArgs,
            })
            expect(report.healAttempts).toBe(1)
            expect(report.verification).toBeDefined()
            expect(report.verification!.healed).toBe(true)
            expect(await countRuns(logPath)).toBe(2)
        } finally {
            await harness.close()
            await fs.rm(dir, { recursive: true, force: true })
            await fs.rm(path.join(FIXTURES, 'test-results'), { recursive: true, force: true })
        }
    })

    it('propose mode never heals even with an agent attached', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const { logPath, spec, spawnArgs } = await makeRunner(dir)
        const harness = await createDeepAgentHarness({
            model: FAKE_MODEL,
            modelOverride: new FakeToolCallingModel({ toolCalls: [], toolStyle: 'openai' }),
            mcp: { command: process.execPath, args: [MCP_SERVER] },
            traceDir: 'test-results',
            heal: 'propose',
        })
        try {
            const report = await runDiagnosis({
                tracePath,
                configPath: CONFIG,
                spec,
                traceDir: path.join(dir, 'traces'),
                heal: 'propose',
                agent: harness.agent,
                spawnCommand: process.execPath,
                spawnArgs,
            })
            expect(report.healAttempts).toBe(0)
            expect(report.agentRan).toBe(false)
            expect(report.verification).toBeUndefined()
            expect(await countRuns(logPath)).toBe(1)
        } finally {
            await harness.close()
            await fs.rm(dir, { recursive: true, force: true })
            await fs.rm(path.join(FIXTURES, 'test-results'), { recursive: true, force: true })
        }
    })

    it('propose mode never verifies: the spec runs once', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const { logPath, spec, spawnArgs } = await makeRunner(dir)
        try {
            const report = await runDiagnosis({
                tracePath,
                configPath: CONFIG,
                spec,
                traceDir: path.join(dir, 'traces'),
                heal: 'propose',
                spawnCommand: process.execPath,
                spawnArgs,
            })
            expect(report.agentRan).toBe(false)
            expect(report.verification).toBeUndefined()
            expect(await countRuns(logPath)).toBe(1)
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
            await fs.rm(path.join(FIXTURES, 'test-results'), { recursive: true, force: true })
        }
    })

    it('ask mode without reproduction never verifies', async () => {
        const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-dx-'))
        const tracePath = await makeFailingTrace(dir)
        const harness = await makeAskHarness()
        try {
            const report = await runDiagnosis({
                tracePath,
                traceDir: path.join(dir, 'traces'),
                heal: 'ask',
                agent: harness.agent,
            })
            expect(report.agentRan).toBe(true)
            expect(report.verification).toBeUndefined()
        } finally {
            await harness.close()
            await fs.rm(dir, { recursive: true, force: true })
        }
    })
})
