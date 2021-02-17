import type { Options, Capabilities } from '@wdio/types'

export interface ExtendedCapabilities extends Capabilities.Capabilities {
    'wdio:devtoolsOptions'?: DevToolsOptions
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

export interface DevToolsOptions {
    ignoreDefaultArgs?: string[] | boolean
    headless?: boolean,
    defaultViewport?: {
        width: number,
        height: number
    }
}

export interface AttachOptions extends Partial<SessionFlags>, Partial<Options.WebDriver> {
    sessionId: string,
    capabilities?: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities
    isW3C?: boolean
}