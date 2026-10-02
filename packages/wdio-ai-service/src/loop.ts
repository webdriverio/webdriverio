import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { StructuredToolInterface } from '@langchain/core/tools'
import type { AgentMiddleware } from 'langchain'

import { controlTools, type Outcome } from './tools.js'
import type { TokenUsage } from './errors.js'

export interface LoopOptions {
    model: BaseChatModel
    tools: StructuredToolInterface[]
    systemPrompt: string
    prompt: string
    /**
     * tool calls the model may make
     */
    maxSteps: number
    timeout: number
    middleware?: AgentMiddleware[]
    /**
     * tools that end the loop and the outcome they write to, default `done` and `fail`
     */
    control?: { outcome: Outcome, tools: StructuredToolInterface[] }
}

export interface LoopResult {
    status: 'done' | 'fail'
    summary: string
    usage: TokenUsage
    /**
     * model calls the loop made
     */
    modelCalls: number
}

interface MessageLike {
    _getType?: () => string
    type?: string
    content?: unknown
    usage_metadata?: { input_tokens?: number, output_tokens?: number }
}

function messageType (message: MessageLike) {
    return message._getType?.() || message.type
}

function textOf (message?: MessageLike) {
    if (!message) {
        return ''
    }
    if (typeof message.content === 'string') {
        return message.content
    }
    if (Array.isArray(message.content)) {
        return message.content
            .map((block: { type?: string, text?: unknown }) => block.type === 'text' && typeof block.text === 'string' ? block.text : '')
            .join('')
    }
    return ''
}

/**
 * Run the tool loop for one instruction: LangChain's `createAgent` with the
 * page tools, `done` and `fail`, and the middleware the caller adds (e.g.
 * the read-only workspace from `deepagents`). There are no subagents and
 * no todo list.
 */
export async function runLoop (options: LoopOptions): Promise<LoopResult> {
    const [{ createAgent }, { GraphRecursionError }] = await Promise.all([import('langchain'), import('@langchain/langgraph')])
    const outcome: Outcome = options.control?.outcome || {}
    const control = options.control?.tools || await controlTools(outcome)
    const agent = createAgent({
        model: options.model,
        tools: [...options.tools, ...control],
        systemPrompt: options.systemPrompt,
        middleware: options.middleware || []
    })

    let messages: MessageLike[] = []
    try {
        const result = await agent.invoke(
            { messages: [{ role: 'user', content: options.prompt }] },
            {
                /**
                 * every tool call is a model step plus a tool step
                 */
                recursionLimit: options.maxSteps * 2 + 2,
                signal: AbortSignal.timeout(options.timeout)
            }
        ) as { messages: MessageLike[] }
        messages = result.messages
    } catch (err) {
        const error = err as Error
        if (error instanceof GraphRecursionError || error.name === 'GraphRecursionError') {
            return { status: 'fail', summary: `stopped after ${options.maxSteps} steps without completing the instruction`, usage: { input: 0, output: 0 }, modelCalls: options.maxSteps }
        }
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            return { status: 'fail', summary: `timed out after ${options.timeout}ms`, usage: { input: 0, output: 0 }, modelCalls: 0 }
        }
        throw err
    }

    const aiMessages = messages.filter((message) => messageType(message) === 'ai')
    const usage = aiMessages.reduce<TokenUsage>((total, message) => ({
        input: total.input + (message.usage_metadata?.input_tokens || 0),
        output: total.output + (message.usage_metadata?.output_tokens || 0)
    }), { input: 0, output: 0 })

    /**
     * a model that answers in text instead of calling `done` finished too
     */
    return {
        status: outcome.status || 'done',
        summary: outcome.summary || textOf(aiMessages.at(-1)) || 'done',
        usage,
        modelCalls: aiMessages.length
    }
}
