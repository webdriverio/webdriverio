import { createMiddleware } from 'langchain'
import { ToolMessage } from '@langchain/core/messages'

/** Prefix marking tool output as an error — shared with the UI's error-status detection. */
export const TOOL_ERROR_PREFIX = 'Error: '
export const MAX_RECURSION_LIMIT = 300

const MAX_CONSECUTIVE_DUPLICATES = 3

/** True when tool output carries the error prefix the UI renders as an error status. */
export function isErrorOutput(text: string): boolean {
    return text.startsWith(TOOL_ERROR_PREFIX)
}

export function createLoopGuardMiddleware() {
    let lastKey: string | null = null
    let count = 0
    return createMiddleware({
        name: 'loopGuard',
        wrapToolCall: (request, handler) => {
            const key = JSON.stringify([request.toolCall.name, request.toolCall.args])
            // counter lives in closure state and persists across turns on the shared thread — advisory by design
            count = key === lastKey ? count + 1 : 1
            lastKey = key
            if (count < MAX_CONSECUTIVE_DUPLICATES) {
                return handler(request)
            }
            // TOOL_ERROR_PREFIX marks this as an error for the UI (see isErrorOutput)
            return new ToolMessage({
                tool_call_id: request.toolCall.id ?? '',
                name: request.toolCall.name,
                content: `${TOOL_ERROR_PREFIX}loop guard — this is the ${count}th identical call to \`${request.toolCall.name}\` with the same arguments. It has not worked and will not work on retry. Stop repeating; reconsider the approach (e.g. run the spec with run_spec instead of execute_script, or ask the user).`,
            })
        },
    })
}
