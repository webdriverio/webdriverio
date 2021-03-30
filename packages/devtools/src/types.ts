import type { Capabilities } from '@wdio/types'
import { LaunchOptions, ChromeArgOptions, BrowserOptions, ConnectOptions } from 'puppeteer-core'

export interface ExtendedCapabilities extends Capabilities.Capabilities, WDIODevtoolsOptions {}

export interface WDIODevtoolsOptions {
    'wdio:devtoolsOptions'?: DevToolsOptions
}

export interface DevToolsOptions extends LaunchOptions, ChromeArgOptions, BrowserOptions, ConnectOptions {
    /**
     * if you want to connect to custom chrome debugger address you
     * need to set this flag otherwise WebdriverIO will try to connect
     * to this address.
     */
    customDebuggerAddress?: boolean
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
