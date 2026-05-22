import { createBirpc } from 'birpc'
import type { ServerFunctions, ClientFunctions } from './types.js'
import type { RpcOptions } from './createClientRpc.js'
import type { RpcTransport } from './transport.js'
import { resolveTransport } from './transport.js'

export function createServerRpc<
    ClientFn extends object = ClientFunctions,
    ServerFn extends object = ServerFunctions
>(
    transport: RpcTransport,
    exposed: Partial<ServerFn>,
    options: RpcOptions = {}
) {
    const { onError } = options
    const channel = resolveTransport(transport)

    return createBirpc<ClientFn, ServerFn>(
        exposed as ServerFn,
        {
            post: (msg: unknown) => {
                try {
                    channel.post(msg)
                } catch (err) {
                    const error = err instanceof Error ? err : new Error('Failed to send RPC message')
                    onError?.(error)
                    throw error
                }
            },
            on: (fn: (msg: unknown) => void) => {
                try {
                    channel.on(fn)
                } catch (err) {
                    const error = err instanceof Error ? err : new Error('Failed to register RPC message handler')
                    onError?.(error)
                    throw error
                }
            },
        }
    )
}
