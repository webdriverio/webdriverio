// ───────────────────────────────────────────────
// Birpc-Compatible RPC Interfaces (Simplified)
// ───────────────────────────────────────────────
import type { IPCMessageValue, IPC_MESSAGE_TYPES, WSMessage, AnyWSMessage } from '@wdio/types'
import type { WS_MESSAGE_TYPES, WSMessageValue } from '@wdio/types'

/**
 * Request forwarded from the parent process to a worker carrying a browser
 * WebSocket message. `id` is the communicator-level correlation id used to
 * route the worker response back to the originating WebSocket client. It is
 * intentionally kept separate from any id contained within `message.value`
 * (the browser payload id), so worker responses are routed to the correct
 * client regardless of the browser-side payload id.
 */
export interface WorkerRequest {
    id: number
    message: AnyWSMessage
}

/**
 * Functions exposed by the test runner process (server).
 * These can be called from workers and browser runners.
 */
export interface ServerFunctions {
    sessionStarted(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.sessionStartedMessage]): void
    sessionEnded(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.sessionEnded]): void
    snapshotResults(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.snapshotResultMessage]): void
    printFailureMessage(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.printFailureMessage]): void
    testFrameworkInitMessage(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.testFrameworkInitMessage]): void
    errorMessage(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.errorMessage]): void
    workerEvent(data: { name: 'workerEvent', origin: 'worker', args: WSMessage<WS_MESSAGE_TYPES.coverageMap> | WSMessage<WS_MESSAGE_TYPES.customCommand> }): void
    workerResponse(data:  WSMessageValue[typeof WS_MESSAGE_TYPES.workerResponseMessage]): void
    sessionMetadata(data: IPCMessageValue[typeof IPC_MESSAGE_TYPES.sessionMetadataMessage]): void
}

/*
 * Functions exposed by the test environment (client / worker process).
 * These are called by the main runner / browser-runner communicator.
 *
 * Browser → worker requests that expect a response (command, hook, expect and
 * expect-matchers requests) are forwarded through `workerRequest`. The worker
 * replies via the `workerResponse` server function using the correlation id.
 * `consoleMessage` and `browserTestResult` are fire-and-forget browser events
 * that do not expect a response.
 */
export interface ClientFunctions {
    workerRequest(data: WorkerRequest): void
    consoleMessage(data: WSMessageValue[typeof WS_MESSAGE_TYPES.consoleMessage]): void
    browserTestResult(data: WSMessageValue[typeof WS_MESSAGE_TYPES.browserTestResult]): void
}
