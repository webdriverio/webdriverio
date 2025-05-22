import type { BirpcReturn } from 'birpc'
import type { RunnerFunctions, WorkerFunctions } from './types.js'
export { createWorkerRpc } from './createWorkerRpc.js'

// Runner calls WorkerFunctions, exposes RunnerFunctions
export type RpcInstance = BirpcReturn<WorkerFunctions, RunnerFunctions>
