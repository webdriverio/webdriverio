// ───────────────────────────────────────────────
// Birpc-Compatible RPC Interfaces (Simplified)
// ───────────────────────────────────────────────
import type { IPCMessageValue, IPC_MESSAGE_TYPES, WSMessage, AnyIPCMessage, AnyWSMessage } from '@wdio/types'
import type { WS_MESSAGE_TYPES, WSMessageValue } from '@wdio/types'

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
    expectMatchersRequest(): WSMessageValue[typeof WS_MESSAGE_TYPES.expectMatchersResponse]
    workerEvent(data: { name: 'workerEvent', origin: 'worker', args: WSMessage<WS_MESSAGE_TYPES.coverageMap> }): void
    workerResponseMessage(data:  WSMessageValue[typeof WS_MESSAGE_TYPES.workerResponseMessage]): void
}

/**
 * Functions exposed by the test environment (client).
 * These can be called by the main runner.
 */
export interface ClientFunctions {
    consoleMessage(data: WSMessageValue[typeof WS_MESSAGE_TYPES.consoleMessage]): void
    commandResponseMessage(data: WSMessageValue[typeof WS_MESSAGE_TYPES.commandResponseMessage]): void
    hookResultMessage(data: WSMessageValue[typeof WS_MESSAGE_TYPES.hookResultMessage]): void
    expectResponseMessage(data: WSMessageValue[typeof WS_MESSAGE_TYPES.expectResponseMessage]): void
    coverageMap(data: WSMessageValue[typeof WS_MESSAGE_TYPES.coverageMap]): void
    runCommand(data: WSMessageValue[typeof WS_MESSAGE_TYPES.commandRequestMessage]): Promise<unknown>
    triggerHook(data: WSMessageValue[typeof WS_MESSAGE_TYPES.hookTriggerMessage]): Promise<unknown>
    expectRequest(data: WSMessageValue[typeof WS_MESSAGE_TYPES.expectRequestMessage]): Promise<unknown>
    expectMatchersRequest(): WSMessageValue[typeof WS_MESSAGE_TYPES.expectMatchersResponse]
    sendRaw(message: AnyIPCMessage | AnyWSMessage): void
}
