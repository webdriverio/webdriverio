export interface RpcTransportChannel {
    post: (msg: unknown) => void
    on: (fn: (msg: unknown) => void) => void
    /**
     * remove a previously registered message handler (used by birpc on `$close`)
     */
    off?: (fn: (msg: unknown) => void) => void
    /**
     * remove all handlers registered through this transport. Consumers that
     * create per-worker transports should call this on `sessionEnded`, worker
     * exit or worker kill to avoid leaking listeners.
     */
    dispose?: () => void
}

/**
 * Event used to forward birpc wire frames coming from a worker's child process
 * to the RPC layer. Keeping these frames on a dedicated event (instead of the
 * generic `message` event) prevents them from leaking to other `message`
 * consumers such as the CLI interface.
 */
export const WORKER_RPC_EVENT = 'workerRpcMessage'

/**
 * birpc wire frame markers, see https://github.com/antfu/birpc
 */
const BIRPC_TYPE_REQUEST = 'q'
const BIRPC_TYPE_RESPONSE = 's'

/**
 * Detect a birpc wire frame (request or response). These frames are internal to
 * the RPC layer and must not be reinterpreted as application/IPC messages.
 */
export function isBirpcFrame(msg: unknown): boolean {
    if (!msg || typeof msg !== 'object') {
        return false
    }
    const type = (msg as { t?: unknown }).t
    return type === BIRPC_TYPE_REQUEST || type === BIRPC_TYPE_RESPONSE
}

/**
 * minimal shape of a worker that owns a child process. Kept structural so the
 * `@wdio/rpc` package does not depend on `@wdio/local-runner`.
 */
export interface ProcessRpcWorker {
    childProcess?: { send: (message: unknown, ...args: unknown[]) => unknown }
    on: (event: string, fn: (...args: unknown[]) => void) => unknown
    off: (event: string, fn: (...args: unknown[]) => void) => unknown
}

/**
 * Transport used by the child process side (worker/runner) to talk to its
 * parent through Node.js process IPC. This hides `process.send`/`process.on`
 * from consumers.
 */
export function createProcessRpcTransport(): RpcTransportChannel {
    return {
        post: (msg: unknown) => {
            if (!process.send) {
                throw new Error('process.send not available — RPC communication disabled')
            }
            process.send(msg)
        },
        on: (fn: (msg: unknown) => void) => process.on('message', fn),
        off: (fn: (msg: unknown) => void) => process.off?.('message', fn),
    }
}

/**
 * Transport used by the parent process to talk to a specific worker's child
 * process. The implementation details (`childProcess.send` and the worker's
 * RPC event) are hidden from consumers. Listeners are tracked so they can be
 * removed via `dispose()` when the worker session ends.
 */
export function createWorkerRpcTransport(worker: ProcessRpcWorker): RpcTransportChannel {
    const listeners = new Set<(msg: unknown) => void>()
    return {
        post: (msg: unknown) => {
            if (!worker.childProcess) {
                throw new Error('Unable to send RPC message: worker childProcess is not available')
            }
            worker.childProcess.send(msg)
        },
        on: (fn: (msg: unknown) => void) => {
            worker.on(WORKER_RPC_EVENT, fn as (...args: unknown[]) => void)
            listeners.add(fn)
        },
        off: (fn: (msg: unknown) => void) => {
            worker.off(WORKER_RPC_EVENT, fn as (...args: unknown[]) => void)
            listeners.delete(fn)
        },
        dispose: () => {
            for (const fn of listeners) {
                worker.off(WORKER_RPC_EVENT, fn as (...args: unknown[]) => void)
            }
            listeners.clear()
        },
    }
}

/**
 * 'process' — IPC between a child process and its parent via process.send / process.on.
 * Use this inside a worker (child) process.
 *
 * A custom RpcTransportChannel — pass the peer's send/on methods directly. Use
 * `createWorkerRpcTransport(worker)` in the parent process to talk to a child.
 */
export type RpcTransport = 'process' | RpcTransportChannel

export function resolveTransport(transport: RpcTransport): RpcTransportChannel {
    if (transport === 'process') {
        return createProcessRpcTransport()
    }
    return transport
}
