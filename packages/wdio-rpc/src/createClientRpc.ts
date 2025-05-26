// packages/wdio-rpc/src/createClientRpc.ts
import { createBirpc } from 'birpc'
import type { ServerFunctions, ClientFunctions } from './types.js'

export function createClientRpc<
    ServerFn extends object = ServerFunctions,
    ClientFn extends object = ClientFunctions
>(
    exposed: Partial<ClientFn>,
    post: (msg: unknown) => void,
    on: (fn: (msg: unknown) => void) => void
) {
    return createBirpc<ServerFn, ClientFn>(
        exposed as ClientFn,
        { post, on }
    )
}
