// packages/wdio-rpc/src/createRunnerRpc.ts
import { createBirpc } from 'birpc'
import type { WorkerFunctions, RunnerFunctions } from './types.js'

export function createRunnerRpc(
    exposed: Partial<RunnerFunctions>,
    postMessage: (msg: unknown) => void,
    onMessage: (fn: (msg: unknown) => void) => void
) {
    return createBirpc<WorkerFunctions, RunnerFunctions>(
        exposed as RunnerFunctions,
        {
            post: postMessage,
            on: onMessage
        }
    )
}
