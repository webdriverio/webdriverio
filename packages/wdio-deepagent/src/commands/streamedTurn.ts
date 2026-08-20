import { HumanMessage } from '@langchain/core/messages'
import { Command } from '@langchain/langgraph'
import type { DeepAgent } from 'deepagents'
import { isErrorOutput } from '../agent.js'
import { collectTurnResult, MAX_INTERRUPT_ROUNDS, resolveInterruptDecisions, warnUnresolvedInterrupts } from './turn.js'
import type { ProcessTurnOptions, TurnInterruptRequest, TurnResult } from './turn.js'
import { MAX_RECURSION_LIMIT } from '../loop-guard.js'

export interface StreamedTurnOptions extends ProcessTurnOptions {
    /** Live token deltas of the streamed reply. */
    onToken?: (delta: string) => void
    /** A tool call became observable (model finished its args; before execution). */
    onToolCallStart?: (call: { name: string; callId: string; input: unknown }) => void
    /**
     * A tool call left the running state. `durationMs` is measured client-side.
     * `output` is the call's text result, unless it carried a
     * `TOOL_ERROR_PREFIX` prefixed recovery message — then `status` is
     * flipped to 'error' and the message moves to `error`.
     */
    onToolCallEnd?: (call: { name: string; callId: string; durationMs: number; status: 'finished' | 'error'; error?: string; output?: string }) => void
    /** Token usage per streamed AI message (sum for the session totals). */
    onUsage?: (usage: { inputTokens: number; outputTokens: number }) => void
    /** Aborts the in-flight run (repl shutdown / Ctrl-C). */
    signal?: AbortSignal
}

/**
 * Runs one agent turn through deepagents' experimental v3 stream
 * (`streamEvents(..., { version: 'v3' })`), mirroring `processTurn`'s
 * interrupt/resume loop while pumping live events to `options` callbacks.
 *
 * heal=ask interrupts surface via `run.interrupted` / `run.interrupts`
 * (payload = the HITL request, whose `actionRequests` is
 * `TurnInterruptRequest.actionRequests`); each is resolved through
 * `options.resolveInterrupt` and the run resumes with a new
 * `streamEvents(new Command({ resume: { decisions } }), ...)` on the same
 * thread (harness checkpointer is MemorySaver with thread_id 'default').
 *
 * The v3 engine is experimental — this module is the only consumer;
 * `run`/`diagnose` keep the `processTurn` invoke path.
 */
export async function runStreamedTurn(agent: DeepAgent, text: string, options: StreamedTurnOptions = {}): Promise<TurnResult> {
    const resolve = options.resolveInterrupt ?? (async () => false)
    const streamConfig = () => ({
        version: 'v3' as const,
        recursionLimit: MAX_RECURSION_LIMIT,
        ...(options.signal ? { signal: options.signal } : {}),
    })

    /**
     * Drains one run to completion: streams messages (tokens + usage) and
     * tool calls (start/end with client-measured duration) concurrently
     * with awaiting `run.output`, so when this resolves the run has fully
     * ended and `interrupted`/`interrupts` are final.
     */
    async function pump(run: {
        messages: AsyncIterable<{ text: AsyncIterable<string>; usage: PromiseLike<{ input_tokens: number; output_tokens: number } | undefined> }>
        toolCalls: AsyncIterable<{ name: string; callId: string; input: unknown; output: Promise<unknown>; status: Promise<'running' | 'finished' | 'error'>; error: Promise<string | undefined> }>
        output: PromiseLike<unknown>
    }): Promise<void> {
        await Promise.all([
            (async () => {
                for await (const msg of run.messages) {
                    for await (const delta of msg.text) {
                        options.onToken?.(delta)
                    }
                    const usage = await msg.usage
                    if (usage) {
                        options.onUsage?.({ inputTokens: usage.input_tokens, outputTokens: usage.output_tokens })
                    }
                }
            })(),
            (async () => {
                for await (const call of run.toolCalls) {
                    const startedAt = Date.now()
                    options.onToolCallStart?.({ name: call.name, callId: call.callId, input: call.input })
                    // The library types the promise wide ('running'|'finished'|'error'),
                    // but a resolved status is never 'running'. output rejects on
                    // tool-error events; a tuple's first element is the text
                    // content (content_and_artifact).
                    const [status, error, output] = await Promise.all([
                        call.status,
                        call.error,
                        call.output.catch(() => undefined),
                    ]) as ['finished' | 'error', string | undefined, unknown]
                    const unwrapped = Array.isArray(output) ? output[0] : output
                    const errorOutput = status === 'finished' && typeof unwrapped === 'string' && isErrorOutput(unwrapped)
                    options.onToolCallEnd?.({
                        name: call.name,
                        callId: call.callId,
                        durationMs: Date.now() - startedAt,
                        status: errorOutput ? 'error' : status,
                        error: errorOutput ? unwrapped : (error ?? undefined),
                        output: !errorOutput && unwrapped !== undefined
                            ? (typeof unwrapped === 'string' ? unwrapped : JSON.stringify(unwrapped))
                            : undefined,
                    })
                }
            })(),
            run.output.then(() => undefined),
        ])
    }

    let run = await agent.streamEvents({ messages: [new HumanMessage(text)] }, streamConfig())
    let declined = false
    for (let round = 0; round < MAX_INTERRUPT_ROUNDS; round++) {
        await pump(run)
        if (!run.interrupted || !run.interrupts.length) {
            break
        }
        const { decisions, declined: declinedRound } = await resolveInterruptDecisions(
            run.interrupts,
            (item) => (item as { payload: TurnInterruptRequest }).payload,
            resolve,
        )
        declined = declinedRound
        run = await agent.streamEvents(new Command({ resume: { decisions } }), streamConfig())
        if (declined) {
            break
        }
    }
    if (!declined && run.interrupted && run.interrupts.length) {
        warnUnresolvedInterrupts(run.interrupts.length)
    }
    const finalState = (await run.output) as { messages: unknown[] }
    return collectTurnResult(finalState.messages)
}
