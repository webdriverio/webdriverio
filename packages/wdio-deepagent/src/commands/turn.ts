import { HumanMessage } from '@langchain/core/messages'
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

/**
 * Runs one agent turn (user text in, final reply out) and records the
 * tool calls that happened. Shared by `repl` and `run`.
 */
export async function processTurn(agent: DeepAgent, text: string): Promise<TurnResult> {
    const run = await agent.invoke({ messages: [new HumanMessage(text)] })
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
