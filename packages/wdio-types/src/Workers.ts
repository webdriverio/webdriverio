/* eslint-disable @typescript-eslint/no-explicit-any */
import type { EventEmitter } from 'node:events'
import type { Testrunner as TestrunnerOptions } from './Options.js'

export interface Job {
    caps: WebdriverIO.Capabilities
    specs: string[]
    hasTests: boolean
    baseUrl?: string
    config?: TestrunnerOptions & { sessionId?: string }
    capabilities?: WebdriverIO.Capabilities
}

export type WorkerMessageArgs = Omit<Job, 'caps' | 'specs' | 'hasTests'>

export interface WorkerRunPayload {
    cid: string
    configFile: string
    caps: WebdriverIO.Capabilities
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
    specFileRetries?: number
    content: {
        sessionId?: string
        isMultiremote?: boolean
        capabilities: WebdriverIO.Capabilities
    }
    origin: string
    params: Record<string, string>
}

export interface Worker
    extends Omit<TestrunnerOptions, 'capabilities' | 'specs' | 'rootDir'>,
    EventEmitter {
    capabilities: WebdriverIO.Capabilities
    config: TestrunnerOptions,
    caps: WebdriverIO.Capabilities
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
    expectMatchersRequest,
    expectMatchersResponse,
    coverageMap,
    customCommand,
    initiateBrowserStateRequest,
    initiateBrowserStateResponse,
    browserTestResult
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
    [MESSAGE_TYPES.expectMatchersRequest]: never
    [MESSAGE_TYPES.expectMatchersResponse]: ExpectMatchersResponse
    [MESSAGE_TYPES.coverageMap]: any
    [MESSAGE_TYPES.customCommand]: CustomCommandEvent
    [MESSAGE_TYPES.initiateBrowserStateRequest]: BrowserStateRequest
    [MESSAGE_TYPES.initiateBrowserStateResponse]: BrowserState
    [MESSAGE_TYPES.browserTestResult]: BrowserTestResults
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

export interface ExpectMatchersResponse {
    matchers: string[]
}

export interface BrowserTestResults {
    failures: number
    events: any[]
}

export interface CustomCommandEvent {
    commandName: string
    cid: string
}

export interface BrowserStateRequest {
    cid: string
}

export interface BrowserState {
    customCommands: string[]
}

interface MessageWithPendingPromiseId {
    id: number
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
    scope?: string
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
    element?: any | any[]
    context?: unknown
    /**
     * propagate error stack for inline snapshots
     */
    errorStack?: string
}

export interface ExpectResponseEvent extends MessageWithPendingPromiseId {
    pass: boolean
    message: string
}
