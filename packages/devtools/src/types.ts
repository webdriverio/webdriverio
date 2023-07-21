import type { EventEmitter } from 'node:events'

import type { Options, Capabilities } from '@wdio/types'
import type { ProtocolCommands } from '@wdio/protocols'
import type { LaunchOptions, BrowserLaunchArgumentOptions, BrowserConnectOptions, ConnectOptions } from 'puppeteer-core'
import type { EventEmitter as PuppeteerEventEmitter } from 'puppeteer-core/lib/esm/puppeteer/common/EventEmitter.js'
export interface ExtendedCapabilities extends Capabilities.Capabilities, WDIODevtoolsOptions {}

export interface WDIODevtoolsOptions {
    'wdio:devtoolsOptions'?: DevToolsOptions
}

export interface DevToolsOptions extends LaunchOptions, BrowserLaunchArgumentOptions, BrowserConnectOptions, ConnectOptions {
    /**
     * If you want to start Google Chrome on a custom port
     */
    customPort?: number
}

export interface AttachOptions {
    capabilities: {
        'goog:chromeOptions': {
            debuggerAddress: string
        }
    } | {
        'ms:edgeOptions': {
            debuggerAddress: string
        }
    }
}

export interface BaseClient extends EventEmitter {
    // id of WebDriver session
    sessionId: string
    // assigned capabilities by the browser driver / WebDriver server
    capabilities: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities
    // original requested capabilities
    requestedCapabilities: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities
    // framework options
    options: Options.WebDriver
}

export interface Client extends BaseClient, ProtocolCommands {}

/**
 * Interface keeping together information allowing to remove active listener from emitter.
 */
export interface ActiveListener {
    /** Event Emitter object emitting to the handler. */
    emitter: PuppeteerEventEmitter
    /** Name of the event the handler is attached to. */
    eventName: string
    /** Event function handler, bound to the context of its class instance. */
    boundHandler: (...args: any[]) => any
}
