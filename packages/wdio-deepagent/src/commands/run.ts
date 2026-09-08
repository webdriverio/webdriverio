import type { DeepAgent } from 'deepagents'
import { processTurn } from './turn.js'
import type { ProcessTurnOptions, ToolCallRecord } from './turn.js'

export interface RunMissionResult {
    reply: string
    toolCalls: ToolCallRecord[]
    exitCode: number
}

/**
 * One-shot mission mode (CI-able): run the prompt once, stream the result
 * to stdout, exit 0 on success / 1 on failure. `options` — e.g. an
 * interactive interrupt resolver — are passed through to `processTurn`.
 */
const result = (reply: string, toolCalls: ToolCallRecord[], exitCode: number): RunMissionResult => ({ reply, toolCalls, exitCode })

export async function runMission(agent: DeepAgent, prompt: string, options?: ProcessTurnOptions): Promise<RunMissionResult> {
    try {
        const { reply, toolCalls, failedToolIds } = await processTurn(agent, prompt, options)
        console.log(reply)
        // deepagents swallows some model/tool failures into reply content
        // (see E2E.md E2E-06), so a throw alone can't gate the exit code.
        // A mission that ends on a failed tool call, or with no final answer
        // at all (iteration cap, empty reply), is a failure for CI purposes.
        if (failedToolIds.length > 0) {
            console.error(`[@wdio/deepagent] mission ended with failed tool invocation(s): ${failedToolIds.join(', ')}`)
            return result(reply, toolCalls, 1)
        }
        if (!reply.trim()) {
            console.error('[@wdio/deepagent] mission ended with no final answer')
            return result(reply, toolCalls, 1)
        }
        return result(reply, toolCalls, 0)
    } catch (err) {
        console.error(`[@wdio/deepagent] mission failed: ${(err as Error).message}`)
        return result('', [], 1)
    }
}
