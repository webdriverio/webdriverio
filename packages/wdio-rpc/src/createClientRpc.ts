import { createBirpc } from 'birpc'
import type { ServerFunctions, ClientFunctions } from './types.js'

export interface RpcOptions {
    timeout?: number
    retries?: number
    onError?: (error: Error) => void
}

export function createClientRpc<
    ServerFn extends object = ServerFunctions,
    ClientFn extends object = ClientFunctions
>(
    exposed: Partial<ClientFn>,
    options: RpcOptions = {}
) {
    const { onError } = options

    return createBirpc<ServerFn, ClientFn>(
        exposed as ClientFn,
        {
            post: (msg: unknown) => {
                if (!process.send) {
                    const error = new Error('process.send not available - RPC communication disabled')
                    onError?.(error)
                    throw error
                }
                try {
                    process.send(msg)
                } catch (error) {
                    const rpcError = error instanceof Error ? error : new Error('Failed to send RPC message')
                    onError?.(rpcError)
                    throw rpcError
                }
            },
            on: (fn: (msg: unknown) => void) => {
                try {
                    process.on('message', fn)
                } catch (error) {
                    const rpcError = error instanceof Error ? error : new Error('Failed to register RPC message handler')
                    onError?.(rpcError)
                    throw rpcError
                }
            },
        }
    )
}
