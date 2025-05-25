// packages/wdio-rpc/src/createServerRpc.ts
import { createBirpc } from 'birpc'
import type { ClientFunctions, ServerFunctions } from './types.js'

export function createServerRpc(
    exposed: Partial<ServerFunctions>,
    post: (msg: unknown) => void,
    on: (fn: (msg: unknown) => void) => void
) {
    return createBirpc<ClientFunctions, ServerFunctions>(
        exposed as ServerFunctions,
        {
            post,
            on
        }
    )
}
