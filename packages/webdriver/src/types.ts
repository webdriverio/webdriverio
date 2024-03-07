import type { EventEmitter } from 'node:events'
import type { Options, Capabilities, ThenArg } from '@wdio/types'
import type { WebDriverBidiProtocol, ProtocolCommands } from '@wdio/protocols'

import type { BidiHandler } from './bidi/handler.js'
import type { EventData } from './bidi/localTypes.js'

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
    isIOS: boolean
    isSauce: boolean
    isSeleniumStandalone: boolean
    isDevTools: boolean
    isBidi: boolean
}

type Fn = (...args: any) => any
type ValueOf<T> = T[keyof T]
type ObtainMethods<T> = { [Prop in keyof T]: T[Prop] extends Fn ? ThenArg<ReturnType<T[Prop]>> : never }
type WebDriverBidiCommands = typeof WebDriverBidiProtocol
export type BidiCommands = WebDriverBidiCommands[keyof WebDriverBidiCommands]['socket']['command']
export type BidiResponses = ValueOf<ObtainMethods<Pick<BidiHandler, BidiCommands>>>

type BidiInterface = ObtainMethods<Pick<BidiHandler, BidiCommands>>
type WebDriverClassicEvents = {
    command: { method: string, endpoint: string, body: any }
    result: { method: string, endpoint: string, body: any, result: any }
}
export type BidiEventMap = {
    [Event in keyof Omit<WebDriverBidiCommands, 'sendCommand' | 'sendAsyncCommand'>]: BidiInterface[WebDriverBidiCommands[Event]['socket']['command']]
}

type GetParam<T extends { method: string, params: any }, U extends string> = T extends { method: U } ? T['params'] : never
type EventMap = {
    [Event in EventData['method']]: GetParam<EventData, Event>
} & WebDriverClassicEvents
export interface BidiEventHandler {
    on<K extends keyof EventMap>(event: K, listener: (this: Client, param: EventMap[K]) => void): this
    once<K extends keyof EventMap>(event: K, listener: (this: Client, param: EventMap[K]) => void): this
}

export interface BaseClient extends EventEmitter, SessionFlags {
    // id of WebDriver session
    sessionId: string
    // assigned capabilities by the browser driver / WebDriver server
    capabilities: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities
    // original requested capabilities
    requestedCapabilities: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities
    // framework options
    options: Options.WebDriver
}

export interface Client extends Omit<BaseClient, keyof BidiEventHandler>, ProtocolCommands, BidiHandler, BidiEventHandler {}

export interface AttachOptions extends Partial<SessionFlags>, Partial<Options.WebDriver> {
    sessionId: string
    capabilities?: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities
    isW3C?: boolean
}
