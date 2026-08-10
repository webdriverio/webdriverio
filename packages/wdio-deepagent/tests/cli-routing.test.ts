import { describe, expect, it, vi } from 'vitest'
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

vi.mock('../src/agent.js', () => ({
    createDeepAgentHarness: mocks.createHarness,
}))

vi.mock('../src/commands/run.js', () => ({
    runMission: mocks.runMission,
}))

describe('CLI routing (quick start: wdio deepagent run "<prompt>")', () => {
    it('resolves config from --config, builds the harness, runs the mission, closes and sets exit code', async () => {
        const { run } = await import('../src/index.js')

        const harnessStub = { agent: { name: 'stub-agent' }, close: mocks.close, tools: [], mcpClient: {} }
        mocks.createHarness.mockResolvedValue(harnessStub)
        mocks.runMission.mockResolvedValue({ reply: 'ok', toolCalls: [], exitCode: 0 })
        mocks.close.mockResolvedValue(undefined)

        const prevArgv = process.argv
        process.argv = ['node', 'wdio-deepagent', 'deepagent', 'run', '--config', FIXTURE_CONFIG, 'verify', 'login']
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
        process.argv = ['node', 'wdio-deepagent', 'run', '--config', FIXTURE_CONFIG, 'boom']
        try {
            await run()
            expect(process.exitCode).toBe(1)
        } finally {
            process.argv = prevArgv
            process.exitCode = 0
        }
    })
})
