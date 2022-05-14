import { EventEmitter } from 'node:events'
import type { Options, Capabilities } from '@wdio/types'
import type { ProtocolCommands, ProtocolCommandsAsync } from '@wdio/protocols'

export interface JSONWPCommandError extends Error {
    code?: string
    statusCode?: string
    statusMessage?: string
}

export interface SessionFlags {
    isW3C: boolean
    isChrome: boolean
    isFirefox: boolean
    isAndroid: boolean
    isMobile: boolean
    isIOS: boolean
    isSauce: boolean
    isSeleniumStandalone: boolean
    isDevTools: boolean
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

export interface Client extends BaseClient, ProtocolCommandsAsync {}
export interface ClientSync extends BaseClient, ProtocolCommands {}

export interface AttachOptions extends Partial<SessionFlags>, Partial<Options.WebDriver> {
    sessionId: string
    capabilities?: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities
    isW3C?: boolean
}
