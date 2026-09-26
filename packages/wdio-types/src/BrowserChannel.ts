/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Messages exchanged between the browser and `@wdio/browser-runner`.
 *
 * The browser talks to the runner over the Vite websocket (`wdio:workerMessage`).
 * Request/response pairs that need the Node worker are forwarded with a
 * communicator routing id that is separate from the id inside `value` (that
 * one correlates a promise in the browser).
 *
 * `coverageMap` and `customCommand` share this enum for historic reasons but
 * travel on worker `process.send`, not on the browser channel.
 *
 * Numeric values are the on-wire `type` discriminant and must stay stable.
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
}

export const BROWSER_TO_RUNNER_TYPES = [
    MESSAGE_TYPES.consoleMessage,
    MESSAGE_TYPES.commandRequestMessage,
    MESSAGE_TYPES.hookTriggerMessage,
    MESSAGE_TYPES.expectRequestMessage,
    MESSAGE_TYPES.expectMatchersRequest,
    MESSAGE_TYPES.initiateBrowserStateRequest,
    MESSAGE_TYPES.browserTestResult,
] as const

export const RUNNER_TO_BROWSER_TYPES = [
    MESSAGE_TYPES.commandResponseMessage,
    MESSAGE_TYPES.hookResultMessage,
    MESSAGE_TYPES.expectResponseMessage,
    MESSAGE_TYPES.expectMatchersResponse,
    MESSAGE_TYPES.initiateBrowserStateResponse,
] as const

/**
 * Browser messages that need a reply from the worker. The communicator stores
 * the originating Vite client under a routing id until `workerResponse` arrives.
 * Console output and the final test report are forwarded without that bookkeeping.
 */
export const BROWSER_REQUEST_TYPES = [
    MESSAGE_TYPES.commandRequestMessage,
    MESSAGE_TYPES.hookTriggerMessage,
    MESSAGE_TYPES.expectRequestMessage,
    MESSAGE_TYPES.expectMatchersRequest,
] as const

export const WORKER_PROCESS_EVENT_TYPES = [
    MESSAGE_TYPES.coverageMap,
    MESSAGE_TYPES.customCommand,
] as const

export type BrowserToRunnerType = typeof BROWSER_TO_RUNNER_TYPES[number]
export type RunnerToBrowserType = typeof RUNNER_TO_BROWSER_TYPES[number]
export type BrowserRequestType = typeof BROWSER_REQUEST_TYPES[number]
export type BrowserChannelType = BrowserToRunnerType | RunnerToBrowserType
export type WorkerProcessEventType = typeof WORKER_PROCESS_EVENT_TYPES[number]

/**
 * Error fields that survive `JSON.stringify` / Node IPC. A live `Error`
 * instance does not.
 */
export interface ChannelError {
    name?: string
    message?: string
    stack?: string
}

export interface ConsoleEvent {
    name: 'consoleEvent'
    type: 'log' | 'info' | 'warn' | 'debug' | 'error'
    args: unknown[]
    cid: string
}

export interface ExpectMatchersRequest {
    cid?: string
}

export interface ExpectMatchersResponse {
    matchers: string[]
}

/**
 * Mocha reporter event as produced by `@wdio/mocha-framework`'s `formatMessage`.
 * Fields are optional because not every Mocha event populates the full shape.
 */
export interface BrowserTestEvent {
    type: string
    title?: string
    fullTitle?: string
    pending?: boolean
    passed?: boolean
    file?: string
    duration?: number
    parent?: string
    currentTest?: string
    error?: ChannelError & {
        type?: string
        expected?: unknown
        actual?: unknown
    }
    context?: unknown
    body?: string
    cid?: string
    specs?: string[]
    uid?: string
}

export interface BrowserTestResults {
    failures: number
    events: BrowserTestEvent[]
}

export interface CustomCommandEvent {
    commandName: string
    cid: string
}

/**
 * Istanbul's `window.__coverage__` map. Structural so this package does not
 * depend on istanbul.
 */
export type CoverageMapPayload = Record<string, unknown>

export interface BrowserStateRequest {
    cid: string
}

export interface BrowserState {
    customCommands: string[]
}

export interface HookTriggerEvent {
    id: number
    cid: string
    name: string
    args: unknown[]
}

export interface HookResultEvent {
    id: number
    error?: ChannelError
}

export interface CommandRequestEvent {
    id: number
    cid: string
    commandName: string
    args: unknown[]
    scope?: string
}

export interface CommandResponseEvent {
    id: number
    result?: unknown
    error?: ChannelError
}

export interface ExpectRequestEvent {
    id: number
    cid: string
    matcherName: string
    /**
     * this should be `MatcherState` from `expect` but don't want to introduce
     * this as a dependency to this package, therefore keep it as `any` for now
     */
    scope: any
    args: unknown[]
    element?: any | any[]
    context?: unknown
    /**
     * propagate error stack for inline snapshots
     */
    errorStack?: string
}

export interface ExpectResponseEvent {
    id: number
    pass: boolean
    message: string
}

export interface BrowserChannelValue {
    [MESSAGE_TYPES.consoleMessage]: ConsoleEvent
    [MESSAGE_TYPES.commandRequestMessage]: CommandRequestEvent
    [MESSAGE_TYPES.commandResponseMessage]: CommandResponseEvent
    [MESSAGE_TYPES.hookTriggerMessage]: HookTriggerEvent
    [MESSAGE_TYPES.hookResultMessage]: HookResultEvent
    [MESSAGE_TYPES.expectRequestMessage]: ExpectRequestEvent
    [MESSAGE_TYPES.expectResponseMessage]: ExpectResponseEvent
    [MESSAGE_TYPES.expectMatchersRequest]: ExpectMatchersRequest
    [MESSAGE_TYPES.expectMatchersResponse]: ExpectMatchersResponse
    [MESSAGE_TYPES.initiateBrowserStateRequest]: BrowserStateRequest
    [MESSAGE_TYPES.initiateBrowserStateResponse]: BrowserState
    [MESSAGE_TYPES.browserTestResult]: BrowserTestResults
}

export interface WorkerProcessEventValue {
    [MESSAGE_TYPES.coverageMap]: CoverageMapPayload
    [MESSAGE_TYPES.customCommand]: CustomCommandEvent
}

export type BrowserChannelMessage<T extends BrowserChannelType> = T extends any
    ? { type: T, value: BrowserChannelValue[T] }
    : never

export type AnyBrowserToRunnerMessage = BrowserChannelMessage<BrowserToRunnerType>
export type AnyRunnerToBrowserMessage = BrowserChannelMessage<RunnerToBrowserType>
export type AnyBrowserChannelMessage = BrowserChannelMessage<BrowserChannelType>

/**
 * Bidirectional browser-channel message. Prefer the directional aliases when
 * the sender or receiver is known.
 */
export type SocketMessage = AnyBrowserChannelMessage

export type WorkerProcessEvent<T extends WorkerProcessEventType = WorkerProcessEventType> = T extends any
    ? { type: T, value: WorkerProcessEventValue[T] }
    : never

export type BrowserChannelRoute =
    | { kind: 'drop' }
    | { kind: 'browserState', cid: string }
    | { kind: 'event', message: BrowserChannelMessage<typeof MESSAGE_TYPES.consoleMessage | typeof MESSAGE_TYPES.browserTestResult> }
    | { kind: 'request', message: BrowserChannelMessage<BrowserRequestType> }

const CONSOLE_LEVELS = new Set(['log', 'info', 'warn', 'debug', 'error'])
const BROWSER_TO_RUNNER_TYPE_SET = new Set<number>(BROWSER_TO_RUNNER_TYPES)
const RUNNER_TO_BROWSER_TYPE_SET = new Set<number>(RUNNER_TO_BROWSER_TYPES)

export function browserChannelMessage<T extends BrowserChannelType> (
    type: T,
    value: BrowserChannelValue[T]
): BrowserChannelMessage<T> {
    return { type, value } as BrowserChannelMessage<T>
}

export function workerProcessEvent<T extends WorkerProcessEventType> (
    type: T,
    value: WorkerProcessEventValue[T]
): WorkerProcessEvent<T> {
    return { type, value } as WorkerProcessEvent<T>
}

export function isBrowserChannelMessage<T extends BrowserChannelType> (
    message: unknown,
    type: T
): message is BrowserChannelMessage<T> {
    return isRecord(message) && message.type === type && isRecord(message.value)
}

export function isBrowserRequestMessage (
    message: AnyBrowserToRunnerMessage
): message is BrowserChannelMessage<BrowserRequestType> {
    switch (message.type) {
    case MESSAGE_TYPES.commandRequestMessage:
    case MESSAGE_TYPES.hookTriggerMessage:
    case MESSAGE_TYPES.expectRequestMessage:
    case MESSAGE_TYPES.expectMatchersRequest:
        return true
    case MESSAGE_TYPES.consoleMessage:
    case MESSAGE_TYPES.browserTestResult:
    case MESSAGE_TYPES.initiateBrowserStateRequest:
        return false
    default:
        return assertNever(message)
    }
}

export function isWorkerProcessEvent<T extends WorkerProcessEventType> (
    message: unknown,
    type: T
): message is WorkerProcessEvent<T> {
    return isRecord(message) && message.type === type
}

/**
 * Validate an untrusted Vite websocket payload from the browser.
 * Returns `undefined` when the payload is not a browser → runner message.
 */
export function parseBrowserToRunnerMessage (data: unknown): AnyBrowserToRunnerMessage | undefined {
    if (!isRecord(data) || typeof data.type !== 'number' || !BROWSER_TO_RUNNER_TYPE_SET.has(data.type)) {
        return undefined
    }
    if (!isValidBrowserToRunnerValue(data.type as BrowserToRunnerType, data.value)) {
        return undefined
    }
    return data as AnyBrowserToRunnerMessage
}

/**
 * Validate an untrusted Vite websocket payload from the runner.
 * Returns `undefined` when the payload is not a runner → browser message.
 */
export function parseRunnerToBrowserMessage (data: unknown): AnyRunnerToBrowserMessage | undefined {
    if (!isRecord(data) || typeof data.type !== 'number' || !RUNNER_TO_BROWSER_TYPE_SET.has(data.type)) {
        return undefined
    }
    if (!isValidRunnerToBrowserValue(data.type as RunnerToBrowserType, data.value)) {
        return undefined
    }
    return data as AnyRunnerToBrowserMessage
}

/**
 * Classify a browser → runner payload so the communicator can respond locally,
 * forward a one-way event, or track a request until the worker replies.
 */
export function routeBrowserToRunnerMessage (data: unknown): BrowserChannelRoute {
    const message = parseBrowserToRunnerMessage(data)
    if (!message) {
        return { kind: 'drop' }
    }

    switch (message.type) {
    case MESSAGE_TYPES.initiateBrowserStateRequest:
        return { kind: 'browserState', cid: message.value.cid }
    case MESSAGE_TYPES.consoleMessage:
    case MESSAGE_TYPES.browserTestResult:
        return { kind: 'event', message }
    case MESSAGE_TYPES.commandRequestMessage:
    case MESSAGE_TYPES.hookTriggerMessage:
    case MESSAGE_TYPES.expectRequestMessage:
    case MESSAGE_TYPES.expectMatchersRequest:
        return { kind: 'request', message }
    default:
        return assertNever(message)
    }
}

function isValidBrowserToRunnerValue (type: BrowserToRunnerType, value: unknown): boolean {
    switch (type) {
    case MESSAGE_TYPES.consoleMessage:
        return isConsoleEvent(value)
    case MESSAGE_TYPES.commandRequestMessage:
        return isCommandRequest(value)
    case MESSAGE_TYPES.hookTriggerMessage:
        return isHookTrigger(value)
    case MESSAGE_TYPES.expectRequestMessage:
        return isExpectRequest(value)
    case MESSAGE_TYPES.expectMatchersRequest:
        return isExpectMatchersRequest(value)
    case MESSAGE_TYPES.initiateBrowserStateRequest:
        return isBrowserStateRequest(value)
    case MESSAGE_TYPES.browserTestResult:
        return isBrowserTestResult(value)
    default:
        return assertNever(type)
    }
}

function isValidRunnerToBrowserValue (type: RunnerToBrowserType, value: unknown): boolean {
    switch (type) {
    case MESSAGE_TYPES.commandResponseMessage:
        return isCommandResponse(value)
    case MESSAGE_TYPES.hookResultMessage:
        return isHookResult(value)
    case MESSAGE_TYPES.expectResponseMessage:
        return isExpectResponse(value)
    case MESSAGE_TYPES.expectMatchersResponse:
        return isExpectMatchersResponse(value)
    case MESSAGE_TYPES.initiateBrowserStateResponse:
        return isBrowserState(value)
    default:
        return assertNever(type)
    }
}

function isConsoleEvent (value: unknown): boolean {
    return isRecord(value)
        && value.name === 'consoleEvent'
        && typeof value.type === 'string'
        && CONSOLE_LEVELS.has(value.type)
        && Array.isArray(value.args)
        && typeof value.cid === 'string'
}

function isCommandRequest (value: unknown): boolean {
    return isRecord(value)
        && typeof value.id === 'number'
        && typeof value.cid === 'string'
        && typeof value.commandName === 'string'
        && Array.isArray(value.args)
        && (value.scope === undefined || typeof value.scope === 'string')
}

function isHookTrigger (value: unknown): boolean {
    return isRecord(value)
        && typeof value.id === 'number'
        && typeof value.cid === 'string'
        && typeof value.name === 'string'
        && Array.isArray(value.args)
}

function isExpectRequest (value: unknown): boolean {
    return isRecord(value)
        && typeof value.id === 'number'
        && typeof value.cid === 'string'
        && typeof value.matcherName === 'string'
        && Array.isArray(value.args)
}

function isExpectMatchersRequest (value: unknown): boolean {
    return isRecord(value) && (value.cid === undefined || typeof value.cid === 'string')
}

function isBrowserStateRequest (value: unknown): boolean {
    return isRecord(value) && typeof value.cid === 'string'
}

function isBrowserTestResult (value: unknown): boolean {
    return isRecord(value) && typeof value.failures === 'number' && Array.isArray(value.events)
}

function isCommandResponse (value: unknown): boolean {
    return isRecord(value)
        && typeof value.id === 'number'
        && (value.error === undefined || isRecord(value.error))
}

function isHookResult (value: unknown): boolean {
    return isRecord(value)
        && typeof value.id === 'number'
        && (value.error === undefined || isRecord(value.error))
}

function isExpectResponse (value: unknown): boolean {
    return isRecord(value)
        && typeof value.id === 'number'
        && typeof value.pass === 'boolean'
        && typeof value.message === 'string'
}

function isExpectMatchersResponse (value: unknown): boolean {
    return isRecord(value)
        && Array.isArray(value.matchers)
        && value.matchers.every((matcher) => typeof matcher === 'string')
}

function isBrowserState (value: unknown): boolean {
    return isRecord(value)
        && Array.isArray(value.customCommands)
        && value.customCommands.every((command) => typeof command === 'string')
}

function isRecord (value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function assertNever (value: never): never {
    const type = isRecord(value) ? String((value as { type?: unknown }).type) : 'unknown'
    throw new Error(`Unhandled browser channel message (${type})`)
}
