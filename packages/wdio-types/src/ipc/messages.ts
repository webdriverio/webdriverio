import type { Options, Capabilities } from '@wdio/types'
import type { BrowserData, SnapshotResultMessage, SessionEndedMessage } from '../Runner.js'

export enum IPC_MESSAGE_TYPES {
    snapshotResultMessage = 100,
    sessionEnded,
    sessionStartedMessage,
    readyEventMessage,
    printFailureMessage,
    reporterRealTime,
    errorMessage,
    testFrameworkInitMessage,
    finishedCommandMessage,
    debuggerMessage,
}

export type IPCMessageValue = {
    [IPC_MESSAGE_TYPES.snapshotResultMessage]: SnapshotResultMessage
    [IPC_MESSAGE_TYPES.sessionEnded]: SessionEndedMessage
    [IPC_MESSAGE_TYPES.readyEventMessage]: ReadyEvent
    [IPC_MESSAGE_TYPES.printFailureMessage]: PrintFailureMessagePayload
    [IPC_MESSAGE_TYPES.reporterRealTime]: ReporterRealTime
    [IPC_MESSAGE_TYPES.errorMessage]: Error
    [IPC_MESSAGE_TYPES.testFrameworkInitMessage]: TestFrameworkInit,
    [IPC_MESSAGE_TYPES.sessionStartedMessage]: SessionStartedMessage,
    [IPC_MESSAGE_TYPES.finishedCommandMessage]: FinishedCommand
    [IPC_MESSAGE_TYPES.debuggerMessage]: Debugger
}

export type IPCMessage<T extends IPC_MESSAGE_TYPES> = {
    type: T
    value: IPCMessageValue[T]
}

export type AnyIPCMessage = IPCMessage<IPC_MESSAGE_TYPES>

interface TestFrameworkInit{
    cid: string
    caps: Capabilities.RequestedStandaloneCapabilities
    specs: string[]
    hasTests: boolean
}

interface Error {
    origin: string;
    name: string;
    content: {
        name?: string,
        message?: string,
        stack?: string,
        cid?: string,
        error?: {
            message: string
        },
        fullTitle?: string,
        type?: string,
        state?: string
    }
}

interface PrintFailureMessagePayload {
    cid?: string
    specs?: string[]
    uid?: string
    file?: string
    title?: string
    error?: string
    sessionId?: string
    config?: unknown
    isMultiremote?: boolean
    instanceOptions?: Options.Testrunner
    capabilities?: unknown
    retry?: number
}

interface SessionStartedMessage {
    automationProtocol: string | undefined
    sessionId: string
    isW3C: boolean
    protocol: string | undefined
    hostname: string | undefined
    port: number | undefined
    path: string | undefined
    queryParams?: Record<string, string>
    isMultiremote: boolean
    instances: Record<string, Partial<BrowserData>> | undefined
    capabilities: WebdriverIO.Capabilities
    injectGlobals: boolean | undefined
    headers?: Record<string, string>
}

interface ReadyEvent {
    name: string,
    origin: string
}

interface FinishedCommand {
    origin: string,
    name: string,
    content: {
        command: string,
        result: unknown
    }
}

type Debugger =
    | { origin: 'debugger'; name: 'start'; content?: never }
    | { origin: 'debugger'; name: 'eval'; content: { cmd: string } }
    | { origin: 'debugger'; name: 'stop'; content?: never }

interface ReporterRealTime { origin: string, name: string, content: string }
