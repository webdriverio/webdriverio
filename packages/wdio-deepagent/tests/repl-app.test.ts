import React, { useEffect } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { AIMessage } from '@langchain/core/messages'
import type { DeepAgent } from 'deepagents'
import { runStreamedTurn } from '../src/commands/streamedTurn.js'
import { getPendingApproval } from '../src/commands/ui/approvalBus.js'

// ink's layout engine (yoga-layout) loads its wasm through global fetch at
// import time; the repo's shared fetch mock (setupFiles) returns a
// non-thenable for unknown URLs, which crashes that loader. Restore node's
// real fetch (yoga falls back to its embedded base64 wasm) before loading
// the ink components and ink-testing-library (both pull ink). Static imports
// hoist above this call, so they are imported dynamically.
vi.unstubAllGlobals()

const [{ ReplApp, ReplAppErrorBoundary }, { render }] = await Promise.all([
    import('../src/commands/ui/ReplApp.js'),
    import('ink-testing-library'),
])

/** Empty async iterable — used where a round has no messages/tool calls. */
function empty<T>(): AsyncIterable<T> {
    return (async function* () {})()
}

/** A run that ends on a heal=ask interrupt. */
function interruptedRun(actionRequests: Array<{ name: string; args: unknown; description: string }>) {
    return {
        messages: empty(),
        toolCalls: empty(),
        output: Promise.resolve({ messages: [new AIMessage('')] }),
        interrupted: true,
        interrupts: [{ interruptId: 'i1', payload: { actionRequests } }],
    }
}

/** A run whose output settles only when the stream's AbortSignal fires. */
function abortableRun(signal?: AbortSignal) {
    return {
        messages: empty(),
        toolCalls: empty(),
        output: new Promise((_resolve, reject) => {
            signal?.addEventListener('abort', () => reject(signal.reason ?? new Error('aborted')))
        }),
        interrupted: false,
        interrupts: [],
    }
}

/** ink frames carry ANSI styling codes — strip them for text assertions. */
const stripAnsi = (frame: string | undefined) => frame?.replace(new RegExp(`${String.fromCharCode(27)}\\[[0-9;?]*[a-zA-Z]`, 'g'), '') ?? ''

/** Calls a prop when its tree unmounts — observes ink's app exit. */
function UnmountProbe({ onUnmount }: { onUnmount: () => void }) {
    useEffect(() => () => onUnmount(), [onUnmount])
    return null
}

function replTree(agent: DeepAgent, onUnmount?: () => void) {
    return React.createElement(
        React.Fragment,
        null,
        React.createElement(ReplApp, { agent, onClose: async () => {} }),
        ...(onUnmount ? [React.createElement(UnmountProbe, { onUnmount })] : []),
    )
}

/** Waits a macrotask so React's passive effects (useInput re-registration) flush. */
const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 20))

describe('ReplApp Ctrl-C handling', () => {
    it('Ctrl-C while busy cancels the turn and keeps the REPL alive', async () => {
        const streamEvents = vi.fn().mockImplementation((_messages: unknown, options: { signal?: AbortSignal }) =>
            Promise.resolve(abortableRun(options.signal)))
        const agent = { streamEvents } as unknown as DeepAgent
        const onUnmount = vi.fn()
        const { stdin, lastFrame } = render(replTree(agent, onUnmount))

        await vi.waitFor(() => expect(stripAnsi(lastFrame())).toContain('wdio-deepagent REPL'))
        stdin.write('hello')
        // the TextInput's useInput closure still holds the pre-insert value
        // until its passive effect re-registers — flush before pressing Enter
        await flush()
        stdin.write('\r')
        await vi.waitFor(() => expect(stripAnsi(lastFrame())).toContain('still running the previous turn'))
        await flush()
        expect(streamEvents).toHaveBeenCalledTimes(1)

        stdin.write('\x03')
        await vi.waitFor(() => expect(stripAnsi(lastFrame())).toContain('wdio>'))
        expect(stripAnsi(lastFrame())).toContain('idle')
        expect(stripAnsi(lastFrame())).not.toContain('… running')
        expect(stripAnsi(lastFrame())).not.toContain('turn failed')
        expect(onUnmount).not.toHaveBeenCalled()
        expect(streamEvents).toHaveBeenCalledTimes(1)
    })

    it('Ctrl-C while idle exits the app', async () => {
        const agent = { streamEvents: vi.fn() } as unknown as DeepAgent
        const onUnmount = vi.fn()
        const { stdin, lastFrame } = render(replTree(agent, onUnmount))

        await vi.waitFor(() => expect(stripAnsi(lastFrame())).toContain('wdio-deepagent REPL'))
        stdin.write('\x03')
        await vi.waitFor(() => expect(onUnmount).toHaveBeenCalled())
    })

    it('Ctrl-C during a pending approval rejects the approval', async () => {
        const actionRequests = [{ name: 'write_file', args: { path: 'x.txt' }, description: 'write x.txt' }]
        const streamEvents = vi.fn().mockResolvedValueOnce(interruptedRun(actionRequests))
        const agent = { streamEvents } as unknown as DeepAgent
        const { stdin, lastFrame } = render(replTree(agent))

        await vi.waitFor(() => expect(stripAnsi(lastFrame())).toContain('wdio-deepagent REPL'))
        stdin.write('go')
        await flush()
        stdin.write('\r')
        await vi.waitFor(() => expect(getPendingApproval()).not.toBeNull())
        await vi.waitFor(() => expect(stripAnsi(lastFrame())).toContain('Approval required'))
        await flush()

        stdin.write('\x03')
        await vi.waitFor(() => expect(getPendingApproval()).toBeNull())
        await vi.waitFor(() => expect(stripAnsi(lastFrame())).toContain('turn failed: turn cancelled'))
        expect(stripAnsi(lastFrame())).not.toContain('Approval required')
        expect(stripAnsi(lastFrame())).toContain('wdio>')
        expect(streamEvents).toHaveBeenCalledTimes(1)
    })

    it('Ctrl-C still exits when the tree crashed (error boundary fallback)', async () => {
        const onUnmount = vi.fn()
        const Boom = (): never => {
            throw new Error('boom')
        }
        const { stdin, lastFrame } = render(
            React.createElement(
                React.Fragment,
                null,
                React.createElement(ReplAppErrorBoundary, null, React.createElement(Boom)),
                React.createElement(UnmountProbe, { onUnmount }),
            ),
        )

        await vi.waitFor(() => expect(stripAnsi(lastFrame())).toContain('REPL UI crashed'))
        // CrashFallback's useInput registers in a passive effect after the
        // fallback commit — flush before sending Ctrl-C
        await flush()
        stdin.write('\x03')
        await vi.waitFor(() => expect(onUnmount).toHaveBeenCalled())
    })

    it('aborting a streamed turn does not produce an unhandledRejection', async () => {
        const streamEvents = vi.fn().mockImplementation((_messages: unknown, options: { signal?: AbortSignal }) =>
            Promise.resolve(abortableRun(options.signal)))
        const agent = { streamEvents } as unknown as DeepAgent
        const ac = new AbortController()
        const spy = vi.fn()
        process.on('unhandledRejection', spy)
        try {
            const turn = runStreamedTurn(agent, 'hi', { signal: ac.signal })
            await flush()
            ac.abort()
            await expect(turn).rejects.toThrow()
            await flush()
            await flush()
        } finally {
            process.removeListener('unhandledRejection', spy)
        }
        expect(spy).not.toHaveBeenCalled()
    })
})
