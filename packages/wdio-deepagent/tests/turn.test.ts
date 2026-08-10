import { describe, expect, it, vi } from 'vitest'
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import { Command } from '@langchain/langgraph'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { DeepAgent } from 'deepagents'
import { FakeToolCallingModel } from 'langchain'
import { createDeepAgentHarness } from '../src/agent.js'
import { extractAgentReply, processTurn } from '../src/commands/turn.js'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const MCP_SERVER = path.join(FIXTURES, 'mcp-server.mjs')

describe('extractAgentReply', () => {
    it('returns plain string content from the last AI message', () => {
        const messages = [
            new ToolMessage({ content: 'done', tool_call_id: 'c1' }),
            new AIMessage('all good'),
        ]
        expect(extractAgentReply(messages)).toBe('all good')
    })

    it('joins text blocks from anthropic-style block content (thinking + text)', () => {
        const messages = [
            new AIMessage({
                content: [
                    { type: 'thinking', thinking: 'plan', signature: 's' },
                    { type: 'text', text: 'The title is' },
                    { type: 'text', text: 'Fixture Page' },
                ],
            }),
        ]
        expect(extractAgentReply(messages)).toBe('The title is\nFixture Page')
    })

    it('ignores block content with no text blocks (thinking-only reply)', () => {
        const messages = [
            new AIMessage({ content: [{ type: 'thinking', thinking: 'no text', signature: 's' }] }),
        ]
        expect(extractAgentReply(messages)).toBe('')
    })

    it('returns empty when there is no AI message', () => {
        expect(extractAgentReply([new ToolMessage({ content: 'done', tool_call_id: 'c1' })])).toBe('')
    })
})

describe('processTurn', () => {
    const interrupted = (actionRequests: Array<{ name: string; args: unknown; description: string }>) => ({
        messages: [new AIMessage({
            content: '',
            tool_calls: actionRequests.map((a, i) => ({ name: a.name, args: a.args, id: `call-${i}` })),
        })],
        __interrupt__: [{ value: { actionRequests, reviewConfigs: [] } }],
    })

    it('resumes a heal=ask interrupt with an approval Command and returns the final reply', async () => {
        const invoke = vi.fn()
            .mockResolvedValueOnce(interrupted([
                { name: 'write_file', args: { path: 'x.txt' }, description: 'write x.txt' },
            ]))
            .mockResolvedValueOnce({
                messages: [new ToolMessage({ content: 'ok', tool_call_id: 'call-0' }), new AIMessage('file written')],
            })
        const agent = { invoke } as unknown as DeepAgent

        const result = await processTurn(agent, 'write the file')

        expect(result.reply).toBe('file written')
        // first invoke: plain input; second: a resume Command
        expect(invoke).toHaveBeenCalledTimes(2)
        expect(invoke.mock.calls[0][0]).toMatchObject({ messages: [expect.any(HumanMessage)] })
        const cmd = invoke.mock.calls[1][0] as Command
        expect(cmd).toBeInstanceOf(Command)
        expect((cmd as unknown as { resume: { decisions: unknown[] } }).resume.decisions)
            .toEqual([{ type: 'approve' }])
    })

    it('loops through multiple sequential interrupts', async () => {
        const invoke = vi.fn()
            .mockResolvedValueOnce(interrupted([
                { name: 'write_file', args: { path: 'a.txt' }, description: 'write a.txt' },
            ]))
            .mockResolvedValueOnce(interrupted([
                { name: 'edit_file', args: { path: 'b.txt' }, description: 'edit b.txt' },
            ]))
            .mockResolvedValueOnce({ messages: [new AIMessage('both done')] })
        const agent = { invoke } as unknown as DeepAgent

        const result = await processTurn(agent, 'go')

        expect(result.reply).toBe('both done')
        expect(invoke).toHaveBeenCalledTimes(3)
        const resumes = invoke.mock.calls.slice(1).map((c) => (c[0] as Command))
        for (const r of resumes) {
            expect(r).toBeInstanceOf(Command)
            expect((r as unknown as { resume: { decisions: unknown[] } }).resume.decisions)
                .toEqual([{ type: 'approve' }])
        }
    })

    it('rejects when resolveInterrupt declines and stops prompting', async () => {
        const invoke = vi.fn()
            .mockResolvedValueOnce(interrupted([
                { name: 'write_file', args: { path: 'x.txt' }, description: 'write x.txt' },
            ]))
            .mockResolvedValueOnce({
                messages: [new ToolMessage({ content: 'rejected', tool_call_id: 'call-0' }), new AIMessage('ok, skipping')],
            })
        const agent = { invoke } as unknown as DeepAgent

        const result = await processTurn(agent, 'write the file', { resolveInterrupt: async () => false })

        expect(result.reply).toBe('ok, skipping')
        expect(invoke).toHaveBeenCalledTimes(2)
        const cmd = invoke.mock.calls[1][0] as Command
        expect((cmd as unknown as { resume: { decisions: unknown[] } }).resume.decisions)
            .toEqual([{ type: 'reject', message: 'User declined the action.' }])
    })

    it('resumes a real heal=ask interrupt through the harness and applies the gated write', async () => {
        const projRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-turn-'))
        const spec = path.join(projRoot, 'spec.js')
        await fs.writeFile(spec, 'const a = 1\n')
        const harness = await createDeepAgentHarness({
            model: { provider: 'openai', model: 'fake' },
            modelOverride: new FakeToolCallingModel({
                toolCalls: [[{
                    name: 'edit_file',
                    args: { file_path: spec, old_string: 'const a = 1', new_string: 'const a = 2' },
                    id: 'call-edit-1',
                }], []],
                toolStyle: 'openai',
            }),
            mcp: { command: process.execPath, args: [MCP_SERVER] },
            traceDir: 'test-results',
            projectRoot: projRoot,
            heal: 'ask',
        })
        try {
            // without resume handling the gated write would be dropped and
            // the turn would end on the interrupted (tool-call) message
            await processTurn(harness.agent, 'fix the spec')
            expect(await fs.readFile(spec, 'utf8')).toBe('const a = 2\n')
        } finally {
            await harness.close()
            await fs.rm(projRoot, { recursive: true, force: true })
        }
    })
})
