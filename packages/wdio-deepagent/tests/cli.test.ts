import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HumanMessage } from '@langchain/core/messages'
import { FakeToolCallingModel } from 'langchain'
import { parseFlags } from '../src/commands/flags.js'
import { processTurn } from '../src/commands/turn.js'
import { createDeepAgentHarness } from '../src/agent.js'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const MCP_SERVER = path.join(FIXTURES, 'mcp-server.mjs')

describe('parseFlags', () => {
    it('parses value flags and positionals', () => {
        const flags = parseFlags(['--config', 'wdio.conf.ts', '--heal', 'auto', '--model', 'ollama:llama3', 'explore', 'the', 'site'])
        expect(flags).toEqual({
            config: 'wdio.conf.ts',
            heal: 'auto',
            model: 'ollama:llama3',
            positionals: ['explore', 'the', 'site'],
        })
    })

    it('rejects invalid heal values and missing flag values', () => {
        expect(() => parseFlags(['--heal', 'sometimes'])).toThrow(/ask \| propose \| auto/)
        expect(() => parseFlags(['--config'])).toThrow(/requires a value/)
    })

    it('rejects unknown flags instead of merging them into the prompt', () => {
        expect(() => parseFlags(['--hel', 'ask'])).toThrow(/Unknown flag "--hel"/)
    })

    it('handles no-flag invocation', () => {
        expect(parseFlags([])).toEqual({})
    })

    it('parses --no-mcp', () => {
        expect(parseFlags(['--no-mcp'])).toEqual({ noMcp: true })
    })

    it('parses --no-mcp alongside value flags', () => {
        expect(parseFlags(['--no-mcp', '--heal', 'auto', 'run', 'fix it'])).toEqual({
            noMcp: true,
            heal: 'auto',
            positionals: ['run', 'fix it'],
        })
    })
})

describe('processTurn', () => {
    it('runs a turn and records tool calls + final reply', async () => {
        const harness = await createDeepAgentHarness({
            model: { provider: 'openai', model: 'fake' },
            modelOverride: new FakeToolCallingModel({
                toolCalls: [[{ name: 'fixture_navigate', args: { url: 'https://example.com' }, id: 'call-1' }]],
                toolStyle: 'openai',
            }),
            mcp: { command: process.execPath, args: [MCP_SERVER] },
            traceDir: 'test-results',
            heal: 'ask',
        })
        try {
            const result = await processTurn(harness.agent, 'go to the homepage')
            expect(result.toolCalls).toEqual([{ name: 'fixture_navigate', args: { url: 'https://example.com' } }])
            expect(typeof result.reply).toBe('string')
        } finally {
            await harness.close()
        }
    })
})

describe('CLI index', () => {
    it('help exits cleanly', async () => {
        // run() reads process.argv; simulate by invoking the module path
        const { run } = await import('../src/index.js')
        const prev = process.argv
        process.argv = ['node', 'wdio-deepagent', 'help']
        try {
            await run()
            expect(process.exitCode).toBe(0)
        } finally {
            process.argv = prev
            process.exitCode = 0
        }
    })
})
