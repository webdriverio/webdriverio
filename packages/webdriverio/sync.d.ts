import * as WebDriver from 'webdriver'
import {
    Browser as BrowserType,
    Element as ElementType,
    MultiRemoteBrowser as MultiRemoteBrowserType,
    ElementArray,

    BrowserCommandsTypeSync,
    ElementCommandsTypeSync,
} from './src/types'

declare global {
    namespace WebdriverIO {
        interface Browser extends BrowserType, BrowserCommandsTypeSync, Omit<WebDriver.ClientSync, 'options'> {}
        interface Element extends ElementType, Omit<BrowserCommandsTypeSync, keyof ElementCommandsTypeSync>, ElementCommandsTypeSync, Omit<WebDriver.ClientSync, 'options'> {}
        interface MultiRemoteBrowser extends MultiRemoteBrowserType, BrowserCommandsTypeSync, Omit<WebDriver.ClientSync, 'sessionId' | 'options'> {
            sessionId?: string
            (instanceName: string): WebdriverIO.Browser
        }
    }

    module NodeJS {
        interface Global {
            browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
            driver: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
        }
    }

    function $(...args: Parameters<BrowserCommandsTypeSync['$']>): WebdriverIO.Element
    function $$(...args: Parameters<BrowserCommandsTypeSync['$$']>): ElementArray
    const browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    const driver: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
}
