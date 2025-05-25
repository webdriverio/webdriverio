// packages/wdio-rpc/src/createClientRpc.ts
import { createBirpc } from 'birpc'
import type { ServerFunctions, ClientFunctions } from './types.js'

export function createClientRpc(
    exposed: Partial<ClientFunctions>,
    post: (msg: unknown) => void,
    on: (fn: (msg: unknown) => void) => void
) {
    return createBirpc<ServerFunctions, ClientFunctions>(
        exposed as ClientFunctions,
        {
            post,
            on
        }
    )
}
