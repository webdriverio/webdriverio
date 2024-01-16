import type { EventEmitter } from 'node:events'
import type { Testrunner as TestrunnerOptions } from './Options.js'
import type {
    DesiredCapabilities,
    MultiRemoteCapabilities,
    RemoteCapability,
    W3CCapabilities,
} from './Capabilities.js'

export interface Job {
    caps: DesiredCapabilities | W3CCapabilities | MultiRemoteCapabilities
    specs: string[]
    hasTests: boolean
}

export type WorkerMessageArgs = Omit<Job, 'caps' | 'specs' | 'hasTests'>

export interface WorkerRunPayload {
    cid: string
    configFile: string
    caps: RemoteCapability
    specs: string[]
    execArgv: string[]
    retries: number
}

export interface WorkerCommand extends Omit<WorkerRunPayload, 'execArgv'> {
    command: string
    args: any
}

export interface WorkerRequest {
    command: 'workerRequest'
    args: {
        id: number
        message: SocketMessage
    }
}

export interface WorkerEvent {
    name: 'workerEvent'
    origin: string
    args: SocketMessage
}

export interface WorkerMessage {
    name: string
    content: {
        sessionId?: string
        isMultiremote?: boolean
        capabilities: RemoteCapability
    }
    origin: string
    params: Record<string, string>
}

export interface Worker
    extends Omit<TestrunnerOptions, 'capabilities' | 'specs' | 'rootDir'>,
        EventEmitter {
    capabilities: RemoteCapability
    config: TestrunnerOptions,
    caps: RemoteCapability
    cid: string
    isBusy?: boolean
    postMessage: (command: string, args: WorkerMessageArgs) => void
    specs: string[]
    sessionId?: string
    logsAggregator: string[]
}

export type WorkerPool = Record<string, Worker>

/**
 * The following defines a new worker messaging system
 */

export enum MESSAGE_TYPES {
    /**
     * @wdio/browser-runner messages
     */
    consoleMessage = 0,
    commandRequestMessage,
    commandResponseMessage,
    hookTriggerMessage,
    hookResultMessage,
    expectRequestMessage,
    expectResponseMessage,
    switchDebugState,
    coverageMap,
    /**
     * @wdio/runner messages
     * TODO: add runner messages
     */
}

interface SocketMessagePayloadType<T extends MESSAGE_TYPES> {
    type: T,
    value: SocketMessageValue[T]
}

export type SocketMessageValue = {
    [MESSAGE_TYPES.consoleMessage]: ConsoleEvent
    [MESSAGE_TYPES.commandRequestMessage]: CommandRequestEvent
    [MESSAGE_TYPES.commandResponseMessage]: CommandResponseEvent
    [MESSAGE_TYPES.hookTriggerMessage]: HookTriggerEvent
    [MESSAGE_TYPES.hookResultMessage]: HookResultEvent
    [MESSAGE_TYPES.expectRequestMessage]: ExpectRequestEvent
    [MESSAGE_TYPES.expectResponseMessage]: ExpectResponseEvent
    [MESSAGE_TYPES.switchDebugState]: boolean
    [MESSAGE_TYPES.coverageMap]: any
}

export type SocketMessagePayload<T extends MESSAGE_TYPES> = T extends any
    ? SocketMessagePayloadType<T>
    : never

export type SocketMessage = SocketMessagePayload<MESSAGE_TYPES>

export interface ConsoleEvent {
    name: 'consoleEvent'
    type: 'log' | 'info' | 'warn' | 'debug' | 'error'
    args: unknown[]
    cid: string
}

interface MessageWithPendingPromiseId {
    id: string
}

export interface HookTriggerEvent extends MessageWithPendingPromiseId {
    cid: string
    name: string
    args: unknown[]
}

export interface HookResultEvent extends MessageWithPendingPromiseId {
    error?: Error
}

export interface CommandRequestEvent extends MessageWithPendingPromiseId {
    cid: string
    commandName: string
    args: unknown[]
}

export interface CommandResponseEvent extends MessageWithPendingPromiseId {
    result?: unknown
    error?: Error
}

export interface ExpectRequestEvent extends MessageWithPendingPromiseId {
    cid: string
    matcherName: string
    /**
     * this should be `MatcherState` from `expect` but don't want to introduce
     * this as a dependency to this package, therefor keep it as `any` for now
     */
    scope: any,
    args: unknown[]
    elementId?: string
}

export interface ExpectResponseEvent extends MessageWithPendingPromiseId {
    pass: boolean
    message: string
}
