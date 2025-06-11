import { createBirpc } from 'birpc'
import type { ServerFunctions, ClientFunctions } from './types.js'

export function createClientRpc<
    ServerFn extends object = ServerFunctions,
    ClientFn extends object = ClientFunctions
>(
    exposed: Partial<ClientFn>
) {
    return createBirpc<ServerFn, ClientFn>(
        exposed as ClientFn,
        {
            post: (msg: unknown) => process.send?.(msg),
            on: (fn: (msg: unknown) => void) => process.on('message', fn),
        }
    )
}
