import { EventEmitter } from 'node:events'

import type { Options, Capabilities } from '@wdio/types'
import type { ProtocolCommandsAsync } from '@wdio/protocols'
import { LaunchOptions, BrowserLaunchArgumentOptions, BrowserConnectOptions, ConnectOptions } from 'puppeteer-core'

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

export interface Client extends BaseClient, ProtocolCommandsAsync {}
