import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import type { BaseMessage } from '@langchain/core/messages'
import type { LLMResult } from '@langchain/core/outputs'
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

/**
 * Run the tool loop for one instruction: LangChain's `createAgent` with the
 * page tools, `done` and `fail`, and the middleware the caller adds (e.g.
 * the read-only workspace from `deepagents`). There are no subagents and
 * no todo list.
 */
export async function runLoop (options: LoopOptions): Promise<LoopResult> {
    const [{ createAgent }, { GraphRecursionError }, { AIMessage }] = await Promise.all([
        import('langchain'),
        import('@langchain/langgraph'),
        import('@langchain/core/messages')
    ])
    const outcome: Outcome = options.control?.outcome || {}
    const control = options.control?.tools || await controlTools(outcome)
    const agent = createAgent({
        model: options.model,
        tools: [...options.tools, ...control],
        systemPrompt: options.systemPrompt,
        middleware: options.middleware || []
    })

    /**
     * Counted as the model answers, so a loop that times out or runs out of
     * steps still reports the calls and tokens it used.
     */
    const usage: TokenUsage = { input: 0, output: 0 }
    let modelCalls = 0
    const counter = {
        handleLLMEnd (output: LLMResult) {
            modelCalls++
            for (const generation of output.generations.flat()) {
                const message = (generation as { message?: BaseMessage }).message
                if (message && AIMessage.isInstance(message)) {
                    usage.input += message.usage_metadata?.input_tokens || 0
                    usage.output += message.usage_metadata?.output_tokens || 0
                }
            }
        }
    }

    let messages: BaseMessage[] = []
    try {
        const result = await agent.invoke(
            { messages: [{ role: 'user', content: options.prompt }] },
            {
                /**
                 * every tool call is a model step plus a tool step
                 */
                recursionLimit: options.maxSteps * 2 + 2,
                signal: AbortSignal.timeout(options.timeout),
                callbacks: [counter]
            }
        ) as { messages: BaseMessage[] }
        messages = result.messages
    } catch (err) {
        const error = err as Error
        if (error instanceof GraphRecursionError || error.name === 'GraphRecursionError') {
            return { status: 'fail', summary: `stopped after ${options.maxSteps} steps without completing the instruction`, usage, modelCalls }
        }
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            return { status: 'fail', summary: `timed out after ${options.timeout}ms`, usage, modelCalls }
        }
        throw err
    }

    if (outcome.status) {
        return { status: outcome.status, summary: outcome.summary || outcome.status, usage, modelCalls }
    }
    /**
     * A model that stops with a text answer did not say it completed the
     * instruction. Its steps are not recorded, a replay could otherwise
     * pass off an unfinished action as done.
     */
    const last = messages.filter((message) => AIMessage.isInstance(message)).at(-1)
    const text = last?.text.trim()
    return {
        status: 'fail',
        summary: `the model stopped without calling \`done\`${text ? `: ${text}` : ''}`,
        usage,
        modelCalls
    }
}
