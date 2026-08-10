import type { DeepAgent } from 'deepagents'
import { processTurn } from './turn.js'

export interface RunMissionResult {
    reply: string
    toolCalls: Array<{ name: string; args: unknown }>
    exitCode: number
}

/**
 * One-shot mission mode (CI-able): run the prompt once, stream the result
 * to stdout, exit 0 on success / 1 on failure.
 */
export async function runMission(agent: DeepAgent, prompt: string): Promise<RunMissionResult> {
    try {
        const { reply, toolCalls, failedToolIds } = await processTurn(agent, prompt)
        console.log(reply)
        // deepagents swallows some model/tool failures into reply content
        // (see E2E.md E2E-06), so a throw alone can't gate the exit code.
        // A mission that ends on a failed tool call, or with no final answer
        // at all (iteration cap, empty reply), is a failure for CI purposes.
        if (failedToolIds.length > 0) {
            const msg = `[@wdio/deepagent] mission ended with failed tool invocation(s): ${failedToolIds.join(', ')}`
            console.error(msg)
            return { reply, toolCalls, exitCode: 1 }
        }
        if (!reply.trim()) {
            console.error('[@wdio/deepagent] mission ended with no final answer')
            return { reply, toolCalls, exitCode: 1 }
        }
        return { reply, toolCalls, exitCode: 0 }
    } catch (err) {
        console.error(`[@wdio/deepagent] mission failed: ${(err as Error).message}`)
        return { reply: '', toolCalls: [], exitCode: 1 }
    }
}
