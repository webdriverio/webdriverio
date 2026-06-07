import { createBirpc } from 'birpc'
import type { ServerFunctions, ClientFunctions } from './types.js'
import type { RpcTransport } from './transport.js'
import { resolveTransport } from './transport.js'

export interface RpcOptions {
    onError?: (error: Error) => void
    /**
     * names of remote functions that should be invoked as fire-and-forget
     * events (no response awaited). Useful when more than one peer listens on
     * the same channel and only one of them implements the function.
     */
    eventNames?: string[]
}

export function createClientRpc<
    ServerFn extends object = ServerFunctions,
    ClientFn extends object = ClientFunctions
>(
    transport: RpcTransport,
    exposed: Partial<ClientFn>,
    options: RpcOptions = {}
) {
    const { onError, eventNames } = options
    const channel = resolveTransport(transport)

    return createBirpc<ServerFn, ClientFn>(
        exposed as ClientFn,
        {
            eventNames: eventNames as (keyof ServerFn)[] | undefined,
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
            off: (fn: (msg: unknown) => void) => channel.off?.(fn),
        }
    )
}
