import type { EventEmitter } from 'node:events'
import type { Options, Capabilities, ThenArg } from '@wdio/types'
import type { WebDriverBidiProtocol, ProtocolCommands } from '@wdio/protocols'

import type { BidiHandler } from './bidi/handler.js'
import type { EventData } from './bidi/localTypes.js'
import type { CommandData } from './bidi/remoteTypes.js'
import type { CommandResponse } from './bidi/localTypes.js'

import type { RequestStartEvent, RequestEndEvent, RequestPerformanceEvent, RequestRetryEvent } from './request/types.js'

export interface SessionRequestError extends Error {
    code?: string
    statusCode?: string
    statusMessage?: string
}

export interface SessionFlags {
    isChromium: boolean
    isFirefox: boolean
    isAndroid: boolean
    isMobile: boolean
    isNativeContext: boolean
    mobileContext: string | undefined
    isIOS: boolean
    isSauce: boolean
    isSeleniumStandalone: boolean
    isBidi: boolean
    isWindowsApp: boolean
    isMacApp: boolean
}

type Fn = (...args: unknown[]) => unknown
type ValueOf<T> = T[keyof T]
type ObtainMethods<T> = { [Prop in keyof T]: T[Prop] extends Fn ? ThenArg<ReturnType<T[Prop]>> : never }
type WebDriverBidiCommands = typeof WebDriverBidiProtocol
export type BidiCommands = WebDriverBidiCommands[keyof WebDriverBidiCommands]['socket']['command']
export type BidiResponses = ValueOf<ObtainMethods<Pick<BidiHandler, BidiCommands>>>
export type RemoteConfig = Options.WebDriver & Capabilities.WithRequestedCapabilities

type BidiInterface = ObtainMethods<Pick<BidiHandler, BidiCommands>>
export interface WebDriverCommandEvent {
    command: string
    method: string
    endpoint: string
    body: unknown
    /** id of the `userCommand` event that ran this command, in a WebDriver BiDi session */
    parent?: number
    /** id of the `userCommand` event that ran this screenshot command, which has no `parent` */
    owner?: number
    /** `true` on the old events of a custom command that is itself the user command: the user command replaces them */
    custom?: boolean
}
export interface WebDriverResultEvent {
    command: string
    method: string
    endpoint: string
    body: unknown
    result: unknown
    /** id of the `userCommand` event that ran this command, in a WebDriver BiDi session */
    parent?: number
    /** id of the `userCommand` event that ran this screenshot command, which has no `parent` */
    owner?: number
    /** `true` on the old events of a custom command that is itself the user command: the user command replaces them */
    custom?: boolean
}
/**
 * A command that the test code calls directly (a WebdriverIO command or a custom command), sent in a
 * WebDriver BiDi session. The body is masked and short.
 * @experimental the name and the fields may change
 */
export interface UserCommandEvent {
    /** the `parent` of the protocol commands that this user command runs */
    id: number
    command: string
    body: unknown[]
    protocol: 'bidi'
    /** the item of the list of `command` that this user command waits for: `` $$(`li`)[3] ``, negative for `.at(-1)` */
    index?: number
    /** id of the user command that runs this one, when that command shows its direct calls (`userCommandEvents.nested`) */
    parent?: number
    /** the session of the browser (of the multi-remote instance) that runs the command */
    sessionId?: string
}
/**
 * The end of a user command
 * @experimental the name and the fields may change
 */
export interface UserResultEvent extends UserCommandEvent {
    result: { value: unknown } | { error: unknown }
}
type WebDriverClassicEvents = {
    command: WebDriverCommandEvent
    result: WebDriverResultEvent
    bidiCommand: CommandData,
    bidiResult: CommandResponse,
    /** @experimental */
    userCommand: UserCommandEvent
    /** @experimental */
    userResult: UserResultEvent
    'request.performance': RequestPerformanceEvent
    'request.retry': RequestRetryEvent
    'request.start': RequestStartEvent
    'request.end': RequestEndEvent
}
export type BidiEventMap = {
    [Event in keyof Omit<WebDriverBidiCommands, 'sendCommand' | 'sendAsyncCommand'>]: BidiInterface[WebDriverBidiCommands[Event]['socket']['command']]
}

type GetParam<T extends { method: string, params: unknown }, U extends string> = T extends { method: U } ? T['params'] : never
export type EventMap = {
    [Event in EventData['method']]: GetParam<EventData, Event>
} & WebDriverClassicEvents
interface BidiEventHandler {
    on<K extends keyof EventMap>(event: K, listener: (this: Client, param: EventMap[K]) => unknown): this
    once<K extends keyof EventMap>(event: K, listener: (this: Client, param: EventMap[K]) => unknown): this
}

export interface BaseClient extends EventEmitter, SessionFlags {
    // id of WebDriver session
    sessionId: string
    // assigned capabilities by the browser driver / WebDriver server
    capabilities: WebdriverIO.Capabilities
    // original requested capabilities
    requestedCapabilities: Capabilities.WithRequestedCapabilities['capabilities']
    // framework options
    options: Options.WebDriver
}

export interface Client extends Omit<BaseClient, keyof BidiEventHandler>, ProtocolCommands, BidiHandler, BidiEventHandler {}

export interface AttachOptions extends Partial<SessionFlags>, Partial<Options.WebDriver> {
    sessionId: string
    // assigned capabilities by the browser driver / WebDriver server
    capabilities?: WebdriverIO.Capabilities
    // original requested capabilities
    requestedCapabilities?: Capabilities.WithRequestedCapabilities['capabilities']
}

/**
 * Additional options outside of the WebDriver spec, exclusively for WebdriverIO, only for runtime, and not sent to Appium
 */
export class CommandRuntimeOptions {

    // mask the text parameter value of the command
    mask?: boolean

    constructor (options: { mask?: boolean }) {
        this.mask = options.mask
    }
}