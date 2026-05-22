export interface RpcTransportChannel {
    post: (msg: unknown) => void
    on: (fn: (msg: unknown) => void) => void
}

/**
 * 'process' — IPC between a child process and its parent via process.send / process.on.
 * Use this inside a worker (child) process.
 *
 * A custom RpcTransportChannel — pass the peer's send/on methods directly.
 * Use this in the parent process to talk to a specific child:
 *
 *   createServerRpc(
 *     { post: (msg) => worker.childProcess?.send(msg), on: (fn) => worker.on('message', fn) },
 *     handlers
 *   )
 */
export type RpcTransport = 'process' | RpcTransportChannel

export function resolveTransport(transport: RpcTransport): RpcTransportChannel {
    if (transport === 'process') {
        return {
            post: (msg: unknown) => {
                if (!process.send) {
                    throw new Error('process.send not available — RPC communication disabled')
                }
                process.send(msg)
            },
            on: (fn: (msg: unknown) => void) => process.on('message', fn),
        }
    }
    return transport
}
