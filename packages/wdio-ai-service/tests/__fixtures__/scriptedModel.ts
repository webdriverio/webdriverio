import { BaseChatModel } from '@langchain/core/language_models/chat_models'
import { AIMessage, type BaseMessage } from '@langchain/core/messages'
import type { ChatResult } from '@langchain/core/outputs'

export type ScriptStep =
    /**
     * `args` can be computed from the result of the previous tool call,
     * e.g. to pick a ref from a snapshot
     */
    | { tool: string, args?: Record<string, unknown> | ((lastToolResult: string) => Record<string, unknown>) }
    | { text: string }

/**
 * A chat model that answers with a fixed list of tool calls, for tests. It
 * records the messages of every call, so a test can check what the model
 * was sent.
 */
export class ScriptedChatModel extends BaseChatModel {
    lc_namespace = ['wdio', 'ai-service', 'tests']
    readonly calls: BaseMessage[][] = []
    #script: ScriptStep[]
    #count = 0

    constructor (script: ScriptStep[]) {
        super({})
        this.#script = [...script]
    }

    _llmType () {
        return 'scripted'
    }

    /**
     * names of the tools of the last loop
     */
    boundTools: string[] = []

    override bindTools (tools: { name?: string }[]) {
        this.boundTools = tools.map((t) => t.name || '')
        return this as unknown as ReturnType<BaseChatModel['bindTools']>
    }

    async _generate (messages: BaseMessage[]): Promise<ChatResult> {
        this.calls.push(messages)
        const next = this.#script.shift() ?? { text: 'out of script' }
        const last = messages.at(-1)
        const lastToolResult = last && last.getType() === 'tool' ? String(typeof last.content === 'string' ? last.content : JSON.stringify(last.content)) : ''
        const message = 'tool' in next
            ? new AIMessage({
                content: '',
                tool_calls: [{ id: `call_${++this.#count}`, name: next.tool, args: typeof next.args === 'function' ? next.args(lastToolResult) : next.args || {}, type: 'tool_call' }],
                usage_metadata: { input_tokens: 100, output_tokens: 10, total_tokens: 110 }
            })
            : new AIMessage({ content: next.text, usage_metadata: { input_tokens: 100, output_tokens: 10, total_tokens: 110 } })
        return { generations: [{ message, text: typeof message.content === 'string' ? message.content : '' }] }
    }

    /**
     * text of every message the model was sent so far
     */
    sentText () {
        return this.calls.flat().map((message) => {
            if (typeof message.content === 'string') {
                return message.content
            }
            return (message.content as { type?: string, text?: string }[])
                .map((block) => block.type === 'text' ? block.text : JSON.stringify(block))
                .join('\n')
        }).join('\n')
    }
}
