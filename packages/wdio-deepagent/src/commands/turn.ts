import { HumanMessage } from '@langchain/core/messages'
import { Command } from '@langchain/langgraph'
import type { DeepAgent } from 'deepagents'

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

/**
 * Extracts the final AI reply text from an agent run's messages. Handles
 * both plain string content and anthropic-style content block arrays
 * (`[{type:'thinking'...}, {type:'text', text:...}]`) — with block
 * content a string-only check silently drops the reply.
 */
export function extractAgentReply(messages: unknown[]): string {
    for (const m of [...messages].reverse()) {
        const type = (m as { _getType?: () => string })._getType?.()
        const content = (m as { content?: unknown }).content
        if (type !== 'ai') {
            continue
        }
        if (typeof content === 'string' && content.trim()) {
            return content
        }
        if (Array.isArray(content)) {
            const text = content
                .filter((p: { type?: string; text?: unknown }) => p.type === 'text' && typeof p.text === 'string')
                .map((p: { text: string }) => p.text)
                .join('\n')
                .trim()
            if (text) {
                return text
            }
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
     * continues). Default: auto-approve — `run` in CI must not silently drop
     * gated writes. `repl` passes a y/N prompt instead.
     */
    resolveInterrupt?: (request: TurnInterruptRequest) => Promise<boolean>
}

/** Resume-round guard: a looping model cannot spin the graph forever. */
export const MAX_INTERRUPT_ROUNDS = 5

/**
 * Runs one agent turn (user text in, final reply out) and records the
 * tool calls that happened. Shared by `repl` and `run`.
 *
 * heal=ask interrupts (humanInTheLoopMiddleware) return an `__interrupt__`
 * result instead of completing; the gated tool call never executes and the
 * process would otherwise exit 0 with the write silently dropped. Resolve
 * every interrupt and re-invoke with `Command({ resume })` on the same
 * thread (the harness checkpointer is MemorySaver with thread_id 'default'),
 * looping until the graph completes or the user declines.
 */
export async function processTurn(agent: DeepAgent, text: string, options: ProcessTurnOptions = {}): Promise<TurnResult> {
    const resolve = options.resolveInterrupt ?? (async () => true)
    let run = await agent.invoke({ messages: [new HumanMessage(text)] })
    for (let round = 0; round < MAX_INTERRUPT_ROUNDS; round++) {
        const interrupts = (run as { __interrupt__?: unknown[] }).__interrupt__
        if (!interrupts?.length) {
            break
        }
        const decisions: Array<{ type: 'approve' } | { type: 'reject'; message: string }> = []
        let declined = false
        for (const item of interrupts) {
            const request = (item as { value: TurnInterruptRequest }).value
            if (await resolve(request)) {
                decisions.push({ type: 'approve' })
            } else {
                declined = true
                decisions.push({ type: 'reject', message: 'User declined the action.' })
            }
        }
        run = await agent.invoke(new Command({ resume: { decisions } }))
        if (declined) {
            break
        }
    }
    const messages = (run as { messages: unknown[] }).messages

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
        if ((m as { _getType?: () => string })._getType?.() === 'tool' && (m as { isError?: boolean }).isError) {
            failedToolIds.push((m as { tool_call_id?: string }).tool_call_id ?? '?')
        }
    }

    return { reply: extractAgentReply(messages), toolCalls, failedToolIds }
}
