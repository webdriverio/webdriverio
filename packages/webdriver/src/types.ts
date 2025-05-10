import type { EventEmitter } from 'node:events'
import type { Options, Capabilities, ThenArg } from '@wdio/types'
import type { WebDriverBidiProtocol, ProtocolCommands } from '@wdio/protocols'

import type { BidiHandler } from './bidi/handler.js'
import type { EventData } from './bidi/localTypes.js'
import type { CommandData } from './bidi/remoteTypes.js'
import type { CommandResponse } from './bidi/localTypes.js'

import type { RequestStartEvent, RequestEndEvent, RequestPerformanceEvent, RequestRetryEvent } from './request/types.js'

export interface JSONWPCommandError extends Error {
    code?: string
    statusCode?: string
    statusMessage?: string
}

export interface SessionFlags {
    isW3C: boolean
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
}
export interface WebDriverResultEvent {
    command: string
    method: string
    endpoint: string
    body: unknown
    result: unknown
}
type WebDriverClassicEvents = {
    command: WebDriverCommandEvent
    result: WebDriverResultEvent
    bidiCommand: Omit<CommandData, 'id'>,
    bidiResult: CommandResponse,
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
    on<K extends keyof EventMap>(event: K, listener: (this: Client, param: EventMap[K]) => void): this
    once<K extends keyof EventMap>(event: K, listener: (this: Client, param: EventMap[K]) => void): this
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

export interface CommandRuntimeOptions {
    // mask the text parameter value of the command
    mask?: boolean
}