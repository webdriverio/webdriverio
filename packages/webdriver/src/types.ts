import { EventEmitter } from 'events'
import type { Options, Capabilities } from '@wdio/types'
import type {
    AppiumCommandsAsync, ChromiumCommandsAsync, JSONWPCommandsAsync, MJSONWPCommandsAsync,
    SauceLabsCommandsAsync, SeleniumCommandsAsync, WebDriverCommandsAsync
} from '@wdio/protocols'

export interface ProtocolCommands extends WebDriverCommandsAsync, Omit<JSONWPCommandsAsync, keyof WebDriverCommandsAsync>, AppiumCommandsAsync, ChromiumCommandsAsync, Omit<MJSONWPCommandsAsync, keyof AppiumCommandsAsync | keyof ChromiumCommandsAsync>, SauceLabsCommandsAsync, SeleniumCommandsAsync {}

export interface JSONWPCommandError extends Error {
    code?: string
    statusCode?: string
    statusMessage?: string
}

export interface SessionFlags {
    isW3C: boolean
    isChrome: boolean
    isAndroid: boolean
    isMobile: boolean
    isIOS: boolean
    isSauce: boolean
    isSeleniumStandalone: boolean
    isDevTools: boolean
}

export interface BaseClient extends EventEmitter, SessionFlags, ProtocolCommands {
    // id of WebDriver session
    sessionId: string;
    // assigned capabilities by the browser driver / WebDriver server
    capabilities: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities;
    // original requested capabilities
    requestedCapabilities: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities;
    // framework options
    options: Options.WebDriver
}

export interface Client extends BaseClient {}
export interface ClientAsync extends AsyncClient, BaseClient { }

type AsyncClient = {
    [K in keyof Pick<Client, Exclude<keyof Client, keyof BaseClient>>]:
    (...args: Parameters<Client[K]>) => Promise<ReturnType<Client[K]>>;
}

export interface AttachOptions extends Partial<SessionFlags>, Partial<Options.WebDriver> {
    sessionId: string
    capabilities?: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities
    isW3C?: boolean
}
