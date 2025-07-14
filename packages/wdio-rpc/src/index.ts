import type { ClientFunctions, ServerFunctions } from './types.js'
import type { BirpcReturn } from 'birpc'

export * from './createClientRpc.js'
export * from './createServerRpc.js'
export * from './types.js'

export type { BirpcReturn }
export type { RpcOptions } from './createClientRpc.js'

export type RunnerRpcInstance = BirpcReturn<ServerFunctions, ClientFunctions>
