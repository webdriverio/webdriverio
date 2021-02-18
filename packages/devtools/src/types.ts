import type { Capabilities } from '@wdio/types'

export interface ExtendedCapabilities extends Capabilities.Capabilities, WDIODevtoolsOptions {}

export interface WDIODevtoolsOptions {
    'wdio:devtoolsOptions'?: DevToolsOptions
}

export interface DevToolsOptions {
    ignoreDefaultArgs?: string[] | boolean
    headless?: boolean,
    defaultViewport?: {
        width: number,
        height: number
    }
}
