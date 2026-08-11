import { describe, expect, it, vi } from 'vitest'
import type * as agentModule from '../src/agent.js'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const FIXTURE_CONFIG = path.join(FIXTURES, 'wdio.conf.ts')

// Stub the harness + mission so the CLI path runs with no API key and no
// @wdio/mcp spawn: this test exercises argv → flags → config → harness → run
// routing, i.e. the documented `wdio-deepagent run "<prompt>"` quick start.
const mocks = vi.hoisted(() => ({
    createHarness: vi.fn(),
    runMission: vi.fn(),
    close: vi.fn(),
}))

const mcpMocks = vi.hoisted(() => ({
    serveAsMcpServer: vi.fn(),
}))

vi.mock('../src/agent.js', async (importOriginal) => {
    const original = await importOriginal<typeof agentModule>()
    return { ...original, createDeepAgentHarness: mocks.createHarness }
})

vi.mock('../src/commands/run.js', () => ({
    runMission: mocks.runMission,
}))

vi.mock('../src/mcp/export.js', () => ({ serveAsMcpServer: mcpMocks.serveAsMcpServer }))

describe('CLI routing (quick start: wdio-deepagent run "<prompt>")', () => {
    it('resolves config from --config, builds the harness, runs the mission, closes and sets exit code', async () => {
        const { run } = await import('../src/index.js')

        const harnessStub = { agent: { name: 'stub-agent' }, close: mocks.close, tools: [], mcpClient: {} }
        mocks.createHarness.mockResolvedValue(harnessStub)
        mocks.runMission.mockResolvedValue({ reply: 'ok', toolCalls: [], exitCode: 0 })
        mocks.close.mockResolvedValue(undefined)

        const prevArgv = process.argv
        process.argv = ['node', 'wdio-deepagent', 'run', '--config', FIXTURE_CONFIG, '--heal', 'auto', 'verify', 'login']
        try {
            await run()

            expect(mocks.createHarness).toHaveBeenCalledWith(
                expect.objectContaining({ configPath: FIXTURE_CONFIG, projectRoot: expect.any(String) }),
            )
            expect(mocks.runMission).toHaveBeenCalledWith(harnessStub.agent, 'verify login')
            expect(mocks.close).toHaveBeenCalled()
            expect(process.exitCode).toBe(0)
        } finally {
            process.argv = prevArgv
            process.exitCode = 0
        }
    })

    it('exits 1 and reports failure when the mission fails', async () => {
        const { run } = await import('../src/index.js')

        const harnessStub = { agent: { name: 'stub-agent' }, close: mocks.close, tools: [], mcpClient: {} }
        mocks.createHarness.mockResolvedValue(harnessStub)
        mocks.runMission.mockResolvedValue({ reply: '', toolCalls: [], exitCode: 1 })

        const prevArgv = process.argv
        process.argv = ['node', 'wdio-deepagent', 'run', '--config', FIXTURE_CONFIG, '--heal', 'auto', 'boom']
        try {
            await run()
            expect(process.exitCode).toBe(1)
        } finally {
            process.argv = prevArgv
            process.exitCode = 0
        }
    })

    it('refuses run with heal: propose (read-only mode)', async () => {
        const { run } = await import('../src/index.js')

        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.clearAllMocks()
        const prevArgv = process.argv
        process.argv = ['node', 'wdio-deepagent', 'run', '--config', FIXTURE_CONFIG, 'fix it']
        try {
            await run()
            expect(process.exitCode).toBe(1)
            expect(mocks.createHarness).not.toHaveBeenCalled()
            expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('diagnose'))
        } finally {
            process.argv = prevArgv
            process.exitCode = 0
            errSpy.mockRestore()
            vi.clearAllMocks()
        }
    })

    it('refuses run with heal: ask when stdin is not a TTY', async () => {
        const { run } = await import('../src/index.js')

        const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        vi.clearAllMocks()
        const prevArgv = process.argv
        process.argv = ['node', 'wdio-deepagent', 'run', '--config', FIXTURE_CONFIG, 'fix it']
        process.env.DEEPAGENT_HEAL = 'ask'
        try {
            await run()
            expect(process.exitCode).toBe(1)
            expect(mocks.createHarness).not.toHaveBeenCalled()
            expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('--heal auto'))
        } finally {
            delete process.env.DEEPAGENT_HEAL
            process.argv = prevArgv
            process.exitCode = 0
            errSpy.mockRestore()
            vi.clearAllMocks()
        }
    })

    it('passes an interactive resolver for heal: ask on a TTY', async () => {
        const { run } = await import('../src/index.js')

        const harnessStub = { agent: { name: 'stub-agent' }, close: mocks.close, tools: [], mcpClient: {} }
        mocks.createHarness.mockResolvedValue(harnessStub)
        mocks.runMission.mockResolvedValue({ reply: 'ok', toolCalls: [], exitCode: 0 })
        mocks.close.mockResolvedValue(undefined)

        Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true })
        vi.clearAllMocks()
        const prevArgv = process.argv
        process.argv = ['node', 'wdio-deepagent', 'run', '--config', FIXTURE_CONFIG, 'fix it']
        process.env.DEEPAGENT_HEAL = 'ask'
        try {
            await run()
            expect(mocks.runMission).toHaveBeenCalledWith(
                harnessStub.agent,
                'fix it',
                { resolveInterrupt: expect.any(Function) },
            )
            expect(mocks.close).toHaveBeenCalled()
        } finally {
            delete process.env.DEEPAGENT_HEAL
            delete (process.stdin as { isTTY?: unknown }).isTTY
            process.argv = prevArgv
            process.exitCode = 0
            vi.clearAllMocks()
        }
    })

    it('serves tools via mcp without a model', async () => {
        const { run } = await import('../src/index.js')

        mcpMocks.serveAsMcpServer.mockResolvedValue(undefined)
        vi.clearAllMocks()
        const prevArgv = process.argv
        process.argv = ['node', 'wdio-deepagent', 'mcp', '--no-mcp', '--config', '/nonexistent/wdio.conf.ts']
        try {
            await run()
            expect(mcpMocks.serveAsMcpServer).toHaveBeenCalledWith(
                expect.objectContaining({ mcpClient: null, tools: expect.any(Array) }),
            )
            expect(process.exitCode).toBe(0)
        } finally {
            process.argv = prevArgv
            process.exitCode = 0
            vi.clearAllMocks()
        }
    })
})
