import { createBirpc } from 'birpc'
import type { ServerFunctions, ClientFunctions } from './types.js'

export function createServerRpc<
    ClientFn extends object = ClientFunctions,
    ServerFn extends object = ServerFunctions
>(
    exposed: Partial<ServerFn>,
    post: (msg: unknown) => void,
    on: (fn: (msg: unknown) => void) => void
) {
    return createBirpc<ClientFn, ServerFn>(
        exposed as ServerFn,
        { post, on }
    )
}
