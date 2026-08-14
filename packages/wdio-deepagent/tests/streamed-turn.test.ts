import { describe, expect, it, vi } from 'vitest'
import { AIMessage, HumanMessage, ToolMessage } from '@langchain/core/messages'
import { Command } from '@langchain/langgraph'
import type { DeepAgent } from 'deepagents'
import { runStreamedTurn } from '../src/commands/streamedTurn.js'
import { MAX_INTERRUPT_ROUNDS } from '../src/commands/turn.js'

/** Empty async iterable — used where a round has no messages/tool calls. */
function empty<T>(): AsyncIterable<T> {
    return (async function* () {})()
}

/** A message handle with scripted text deltas and usage. */
function msgHandle(tokens: string[], inputTokens = 5, outputTokens = 3) {
    return {
        text: (async function* () {
            for (const t of tokens) {
                yield t
            }
        })(),
        usage: Promise.resolve({ input_tokens: inputTokens, output_tokens: outputTokens }),
    }
}

/** A tool call handle (status/error are promises, mirroring ToolCallStream). */
function toolHandle(over: {
    name?: string
    callId?: string
    input?: unknown
    status?: 'running' | 'finished' | 'error'
    error?: string | undefined
} = {}) {
    const { name = 'write_file', callId = 'c1', input = { path: 'x.txt' }, status = 'finished', error } = over
    return {
        name,
        callId,
        input,
        status: Promise.resolve(status),
        error: Promise.resolve(error),
    }
}

/** A run that ends on a heal=ask interrupt. */
function interruptedRun(actionRequests: Array<{ name: string; args: unknown; description: string }>, messageList: unknown[] = [new AIMessage('')]) {
    return {
        messages: empty(),
        toolCalls: empty(),
        output: Promise.resolve({ messages: messageList }),
        interrupted: true,
        interrupts: [{ interruptId: 'i1', payload: { actionRequests } }],
    }
}

/** A completed run whose output carries the final message list. */
function doneRun(messageList: unknown[]) {
    return {
        messages: empty(),
        toolCalls: empty(),
        output: Promise.resolve({ messages: messageList }),
        interrupted: false,
        interrupts: [],
    }
}

describe('runStreamedTurn', () => {
    it('streams token deltas in order and reports usage', async () => {
        // a run whose messages yields a streamed handle with two deltas
        const streamEvents = vi.fn().mockResolvedValueOnce({
            messages: (async function* () {
                yield msgHandle(['Hel', 'lo'])
            })(),
            toolCalls: empty(),
            output: Promise.resolve({ messages: [new AIMessage('Hello')] }),
            interrupted: false,
            interrupts: [],
        })
        const agent = { streamEvents } as unknown as DeepAgent
        const tokens: string[] = []
        const usage: Array<{ inputTokens: number; outputTokens: number }> = []
        const result = await runStreamedTurn(agent, 'hi', {
            onToken: (d) => tokens.push(d),
            onUsage: (u) => usage.push(u),
        })

        expect(tokens).toEqual(['Hel', 'lo'])
        expect(usage).toEqual([{ inputTokens: 5, outputTokens: 3 }])
        expect(result.reply).toBe('Hello')
        // first call is the plain input
        expect(streamEvents.mock.calls[0][0]).toMatchObject({ messages: [expect.any(HumanMessage)] })
    })

    it('reports tool call start then end with client-measured duration', async () => {
        const streamEvents = vi.fn().mockResolvedValueOnce({
            messages: empty(),
            toolCalls: (async function* () {
                yield toolHandle()
            })(),
            output: Promise.resolve({ messages: [new AIMessage('ok')] }),
            interrupted: false,
            interrupts: [],
        })
        const agent = { streamEvents } as unknown as DeepAgent
        const starts: Array<{ name: string; callId: string; input: unknown }> = []
        const ends: Array<{ name: string; callId: string; durationMs: number; status: string; error?: string }> = []

        await runStreamedTurn(agent, 'go', {
            onToolCallStart: (c) => starts.push(c),
            onToolCallEnd: (c) => ends.push(c),
        })

        expect(starts).toEqual([{ name: 'write_file', callId: 'c1', input: { path: 'x.txt' } }])
        expect(ends).toHaveLength(1)
        expect(ends[0].status).toBe('finished')
        expect(ends[0].durationMs).toBeGreaterThanOrEqual(0)
        expect(ends[0].error).toBeUndefined()
    })

    it('reports tool call errors with the error message', async () => {
        const streamEvents = vi.fn().mockResolvedValueOnce({
            messages: empty(),
            toolCalls: (async function* () {
                yield toolHandle({ status: 'error', error: 'boom' })
            })(),
            output: Promise.resolve({ messages: [new AIMessage('ok')] }),
            interrupted: false,
            interrupts: [],
        })
        const agent = { streamEvents } as unknown as DeepAgent
        const ends: Array<{ status: string; error?: string }> = []

        await runStreamedTurn(agent, 'go', { onToolCallEnd: (c) => ends.push(c) })

        expect(ends[0].status).toBe('error')
        expect(ends[0].error).toBe('boom')
    })

    it('resolves an interrupt and resumes with an approval Command', async () => {
        const actionRequests = [{ name: 'write_file', args: { path: 'x.txt' }, description: 'write x.txt' }]
        const streamEvents = vi.fn()
            .mockResolvedValueOnce(interruptedRun(actionRequests))
            .mockResolvedValueOnce(doneRun([
                new ToolMessage({ content: 'ok', tool_call_id: 'c1' }),
                new AIMessage({ content: 'file written', tool_calls: [{ name: 'write_file', args: { path: 'x.txt' }, id: 'c1' }] }),
            ]))
        const agent = { streamEvents } as unknown as DeepAgent
        const resolve = vi.fn().mockResolvedValue(true)

        const result = await runStreamedTurn(agent, 'write the file', { resolveInterrupt: resolve })

        expect(result.reply).toBe('file written')
        expect(resolve).toHaveBeenCalledWith({ actionRequests })
        expect(streamEvents).toHaveBeenCalledTimes(2)
        const cmd = streamEvents.mock.calls[1][0] as Command
        expect(cmd).toBeInstanceOf(Command)
        expect((cmd as unknown as { resume: { decisions: unknown[] } }).resume.decisions)
            .toEqual([{ type: 'approve' }])
    })

    it('rejects when resolveInterrupt declines and stops prompting', async () => {
        const streamEvents = vi.fn()
            .mockResolvedValueOnce(interruptedRun([{ name: 'write_file', args: {}, description: 'x' }]))
            .mockResolvedValueOnce(doneRun([new AIMessage('ok, skipping')]))
        const agent = { streamEvents } as unknown as DeepAgent

        const result = await runStreamedTurn(agent, 'go', { resolveInterrupt: async () => false })

        expect(result.reply).toBe('ok, skipping')
        expect(streamEvents).toHaveBeenCalledTimes(2)
        const cmd = streamEvents.mock.calls[1][0] as Command
        expect((cmd as unknown as { resume: { decisions: unknown[] } }).resume.decisions)
            .toEqual([{ type: 'reject', message: 'User declined the action.' }])
    })

    it('auto-approves by default', async () => {
        const streamEvents = vi.fn()
            .mockResolvedValueOnce(interruptedRun([{ name: 'write_file', args: {}, description: 'x' }]))
            .mockResolvedValueOnce(doneRun([new AIMessage('done')]))
        const agent = { streamEvents } as unknown as DeepAgent

        await runStreamedTurn(agent, 'go')

        const cmd = streamEvents.mock.calls[1][0] as Command
        expect((cmd as unknown as { resume: { decisions: unknown[] } }).resume.decisions)
            .toEqual([{ type: 'approve' }])
    })

    it('logs pending interrupts after the resume-round cap and stops', async () => {
        const streamEvents = vi.fn().mockResolvedValue(
            interruptedRun([{ name: 'write_file', args: {}, description: 'x' }])
        )
        const agent = { streamEvents } as unknown as DeepAgent
        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
        try {
            const result = await runStreamedTurn(agent, 'go')
            expect(result.reply).toBe('')
            expect(errorSpy).toHaveBeenCalledWith(expect.stringMatching(/1 gated action/))
            expect(streamEvents).toHaveBeenCalledTimes(MAX_INTERRUPT_ROUNDS + 1)
        } finally {
            errorSpy.mockRestore()
        }
    })
})
