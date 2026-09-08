import { HumanMessage } from '@langchain/core/messages'
import { Command } from '@langchain/langgraph'
import type { DeepAgent } from 'deepagents'
import { MAX_RECURSION_LIMIT, TOOL_ERROR_PREFIX } from '../loop-guard.js'

export interface ToolCallRecord {
    name: string
    args: unknown
}

export interface TurnResult {
    /** Final assistant reply text (may be empty). */
    reply: string
    /** Every tool call the agent made during this turn. */
    toolCalls: ToolCallRecord[]
    /**
     * Tool invocations that failed (`isError` ToolMessages). deepagents
     * converts some tool failures into messages instead of throwing, so
     * runMission needs this signal to flip its exit code.
     */
    failedToolIds: string[]
}

export const TOOL_OUTPUT_CAP = 4000

/** Single builder for the recursion-limit config passed to every invoke/stream. */
export function turnConfig(signal?: AbortSignal): { recursionLimit: number; signal?: AbortSignal } {
    return signal ? { recursionLimit: MAX_RECURSION_LIMIT, signal } : { recursionLimit: MAX_RECURSION_LIMIT }
}

/**
 * Single error/output classifier replacing the `isError` flag check and the
 * `TOOL_ERROR_PREFIX` prefix-unwrap. Unwraps content_and_artifact tuples,
 * flips finished-with-error-prefix to error status, and caps output text.
 */
export function classifyToolOutput(status: 'finished' | 'error', error: string | undefined, output: unknown): { status: 'finished' | 'error'; error?: string; output?: string } {
    const unwrapped = Array.isArray(output) ? output[0] : output
    if (status === 'finished' && typeof unwrapped === 'string' && unwrapped.startsWith(TOOL_ERROR_PREFIX)) {
        return { status: 'error', error: unwrapped }
    }
    if (status === 'error') {
        return { status, error }
    }
    if (unwrapped === undefined) {
        return { status }
    }
    const text = typeof unwrapped === 'string' ? unwrapped : JSON.stringify(unwrapped)
    return { status, output: text.length > TOOL_OUTPUT_CAP ? `${text.slice(0, TOOL_OUTPUT_CAP)}…[truncated ${text.length - TOOL_OUTPUT_CAP} chars]` : text }
}

/** Renders one message content block to text (text blocks only, joined). */
export function blockToText(block: { type?: string; text?: unknown }): string | undefined {
    return block.type === 'text' && typeof block.text === 'string' ? block.text : undefined
}

/**
 * Extracts the final AI reply text from an agent run's messages. Handles
 * both plain string content and anthropic-style content block arrays
 * (`[{type:'thinking'...}, {type:'text', text:...}]`) — with block
 * content a string-only check silently drops the reply.
 */
export function extractAgentReply(messages: unknown[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
        const m = messages[i] as { _getType?: () => string; content?: unknown }
        if (m._getType?.() !== 'ai') {
            continue
        }
        if (typeof m.content === 'string' && m.content.trim()) {
            return m.content
        }
        if (!Array.isArray(m.content)) {
            continue
        }
        const text = (m.content as Array<{ type?: string; text?: unknown }>)
            .map(blockToText)
            .filter((t): t is string => typeof t === 'string')
            .join('\n')
            .trim()
        if (text) {
            return text
        }
    }
    return ''
}

/** Pending human-in-the-loop approval request (deepagents heal=ask gate). */
export interface TurnInterruptRequest {
    actionRequests: Array<{ name: string; args: unknown; description: string }>
}

export interface ProcessTurnOptions {
    /**
     * Decide a pending gated tool call. Return `true` to approve, `false` to
     * reject (the tool call is answered with an error message and the graph
     * continues). Default: decline — a caller that does not wire a resolver
     * must not silently write files on the ask-mode promise. The `run` CLI
     * passes a y/N prompt (`createInterruptResolver`); callers that want
     * auto-approve pass `async () => true` explicitly.
     */
    resolveInterrupt?: (request: TurnInterruptRequest) => Promise<boolean>
}

/** Resume-round guard: a looping model cannot spin the graph forever. */
export const MAX_INTERRUPT_ROUNDS = 5

/** Resolves a batch of pending interrupt requests into resume decisions. */
export type InterruptDecision = { type: 'approve' } | { type: 'reject'; message: string }

export async function resolveInterruptDecisions(
    items: readonly unknown[],
    requestOf: (item: unknown) => TurnInterruptRequest,
    resolve: (request: TurnInterruptRequest) => Promise<boolean>,
): Promise<{ decisions: InterruptDecision[]; declined: boolean }> {
    const decisions: InterruptDecision[] = []
    for (const item of items) {
        const approved = await resolve(requestOf(item))
        decisions.push(approved ? { type: 'approve' } : { type: 'reject', message: 'User declined the action.' })
    }
    return { decisions, declined: decisions.some((d) => d.type === 'reject') }
}

/**
 * Shared interrupt/resume loop scaffold. `getPending` returns the currently
 * pending interrupts (or undefined when the run completed); `resume` resumes
 * with the approved/rejected decisions. Returns whether the user declined.
 */
export async function runInterruptLoop(
    getPending: () => readonly unknown[] | undefined,
    resume: (decisions: InterruptDecision[]) => Promise<void>,
    requestOf: (item: unknown) => TurnInterruptRequest,
    resolve: (request: TurnInterruptRequest) => Promise<boolean>,
): Promise<{ declined: boolean; pending?: readonly unknown[] }> {
    let declined = false
    for (let round = 0; round < MAX_INTERRUPT_ROUNDS; round++) {
        const interrupts = getPending()
        if (!interrupts?.length) {
            return { declined }
        }
        const { decisions } = await resolveInterruptDecisions(interrupts, requestOf, resolve)
        declined = decisions.some((d) => d.type === 'reject')
        await resume(decisions)
        if (declined) {
            return { declined }
        }
    }
    const pending = getPending()
    if (!declined && pending?.length) {
        warnUnresolvedInterrupts(pending.length)
    }
    return { declined, pending }
}

/** Logs gated actions still pending after the resume-round cap was hit. */
export function warnUnresolvedInterrupts(count: number): void {
    console.error(`[@wdio/deepagent] ${count} gated action(s) still pending after ${MAX_INTERRUPT_ROUNDS} resume rounds — not executed.`)
}

/**
 * Runs one agent turn (user text in, final reply out) and records the
 * tool calls that happened. Shared by `repl` and `run`.
 *
 * heal=ask interrupts (humanInTheLoopMiddleware) return an `__interrupt__`
 * result instead of completing; the gated tool call never executes and the
 * process would otherwise exit 0 with the write silently dropped. Resolve
 * every interrupt and re-invoke with `Command({ resume })` on the same
 * configurable thread (the harness checkpointer is MemorySaver, threaded
 * via the `threadId` harness option — default 'default'), looping until
 * the graph completes or the user declines.
 */
export async function processTurn(agent: DeepAgent, text: string, options: ProcessTurnOptions = {}): Promise<TurnResult> {
    const resolve = options.resolveInterrupt ?? (async () => false)
    const config = turnConfig()
    let run = await agent.invoke({ messages: [new HumanMessage(text)] }, config)
    const requestOf = (item: unknown) => (item as { value: TurnInterruptRequest }).value
    await runInterruptLoop(
        () => (run as { __interrupt__?: unknown[] }).__interrupt__,
        async (decisions) => { run = await agent.invoke(new Command({ resume: { decisions } }), config) },
        requestOf,
        resolve,
    )
    return collectTurnResult((run as { messages: unknown[] }).messages)
}

/**
 * Reduces a run's full message list into a {@link TurnResult}: the final
 * reply text, every recorded tool call, and the ids of failed tool
 * invocations. Shared by `processTurn` (invoke path) and
 * `runStreamedTurn` (v3 stream path, fed from `run.output.messages`).
 */
export function collectTurnResult(messages: unknown[]): TurnResult {
    const toolCalls: ToolCallRecord[] = []
    const failedToolIds: string[] = []
    for (const m of messages) {
        const tc = (m as { tool_calls?: Array<{ name?: string; args?: unknown }> }).tool_calls
        if (Array.isArray(tc)) {
            for (const call of tc) {
                if (call.name) {
                    toolCalls.push({ name: call.name, args: call.args })
                }
            }
        }
        const tm = m as { _getType?: () => string; isError?: boolean; tool_call_id?: string; content?: unknown }
        if (tm._getType?.() === 'tool' && (tm.isError || (typeof tm.content === 'string' && tm.content.startsWith(TOOL_ERROR_PREFIX)))) {
            failedToolIds.push(tm.tool_call_id ?? '?')
        }
    }

    return { reply: extractAgentReply(messages), toolCalls, failedToolIds }
}
