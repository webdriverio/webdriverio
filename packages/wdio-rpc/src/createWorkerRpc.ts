import { createBirpc } from 'birpc'
import type { WorkerFunctions, RunnerFunctions } from './types.js'
import type { RpcInstance } from './index.js'

export function createWorkerRpc(): RpcInstance {
    return createBirpc<WorkerFunctions, RunnerFunctions>(
        {} as RunnerFunctions,
        {
            post: msg => process.send!(msg),
            on: fn => process.on('message', fn)
        }
    )
}
