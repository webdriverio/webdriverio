import type { Capabilities } from '@wdio/types'
import { LaunchOptions, ChromeArgOptions, BrowserOptions, ConnectOptions } from 'puppeteer-core'

export interface ExtendedCapabilities extends Capabilities.Capabilities, WDIODevtoolsOptions {}

export interface WDIODevtoolsOptions {
    'wdio:devtoolsOptions'?: DevToolsOptions
}

export interface DevToolsOptions extends LaunchOptions, ChromeArgOptions, BrowserOptions, ConnectOptions {}
