import { AIMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages'
import { fakeModel } from 'langchain'

export type ScriptStep =
    /**
     * `args` can be computed from the result of the previous tool call,
     * e.g. to pick a ref from a snapshot
     */
    | { tool: string, args?: Record<string, unknown> | ((lastToolResult: string) => Record<string, unknown>) }
    | { text: string }

const USAGE = { input_tokens: 100, output_tokens: 10, total_tokens: 110 }

/**
 * `fakeModel` keeps the tools of a `bindTools` call on the copy it returns.
 * Copies share their call state, so the tool names are recorded by it.
 */
type FakeModel = ReturnType<typeof fakeModel>
const boundToolsByState = new WeakMap<object, string[]>()
const prototype = Object.getPrototypeOf(fakeModel()) as FakeModel & { __wdioRecordsTools?: true }
if (!prototype.__wdioRecordsTools) {
    const bindTools = prototype.bindTools
    prototype.bindTools = function (this: FakeModel & { _state: object }, tools: { name?: string }[]) {
        boundToolsByState.set(this._state, tools.map((tool) => tool.name || ''))
        return bindTools.call(this, tools as Parameters<typeof bindTools>[0])
    } as FakeModel['bindTools']
    prototype.__wdioRecordsTools = true
}

export type ScriptedModel = ReturnType<typeof fakeModel> & {
    /**
     * names of the tools of the last loop
     */
    readonly boundTools: string[]
    /**
     * text of every message the model was sent so far
     */
    sentText (): string
}

/**
 * LangChain's `fakeModel` answering with a fixed list of tool calls, one
 * per model call. It records every call, so a test can check what the
 * model was sent and which tools it was given.
 */
export function scriptedModel (script: ScriptStep[]): ScriptedModel {
    const model = fakeModel()
    let id = 0
    for (const step of script) {
        model.respond((messages: BaseMessage[]) => {
            const last = messages.at(-1)
            const lastToolResult = last && ToolMessage.isInstance(last) ? last.text : ''
            if ('text' in step) {
                return new AIMessage({ content: step.text, usage_metadata: USAGE })
            }
            const args = typeof step.args === 'function' ? step.args(lastToolResult) : step.args || {}
            return new AIMessage({ content: '', tool_calls: [{ id: `call_${++id}`, name: step.tool, args, type: 'tool_call' }], usage_metadata: USAGE })
        })
    }

    const state = (model as unknown as { _state: object })._state
    return Object.defineProperties(model, {
        boundTools: {
            get: () => boundToolsByState.get(state) ?? []
        },
        sentText: {
            value: () => model.calls.flatMap((call) => call.messages).map((message) => message.text).join('\n')
        }
    }) as ScriptedModel
}
