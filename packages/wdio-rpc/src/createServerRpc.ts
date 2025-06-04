import { createBirpc } from 'birpc'
import type { ServerFunctions, ClientFunctions } from './types.js'

export function createServerRpc<
    ClientFn extends object = ClientFunctions,
    ServerFn extends object = ServerFunctions
>(
    exposed: Partial<ServerFn>
) {
    return createBirpc<ClientFn, ServerFn>(
        exposed as ServerFn,
        {
            post: (msg: unknown) => process.send?.(msg),
            on: (fn: (msg: unknown) => void) => process.on('message', fn),
        }
    )
}
