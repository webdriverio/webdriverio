import type { Client } from 'webdriver'
import type {
    Browser as BrowserType,
    Element as ElementType,
    BrowserCommandsType,
    ElementCommandsType,
    MultiRemoteBrowser as MultiRemoteBrowserType,
} from './src/types'

declare global {
    namespace WebdriverIO {
        interface Browser extends BrowserType, BrowserCommandsType, Omit<Client, 'options'> { }
        interface Element extends ElementType, Omit<BrowserCommandsType, keyof ElementCommandsType>, ElementCommandsType, Omit<Client, 'options'> {}
        interface MultiRemoteBrowser extends MultiRemoteBrowserType, BrowserCommandsType, Omit<Client, 'sessionId' | 'options'> {
            sessionId?: string
        }
    }

    module NodeJS {
        interface Global {
            browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
            driver: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
        }
    }

    function $(...args: Parameters<WebdriverIO.Browser['$']>): ReturnType<WebdriverIO.Browser['$']>
    function $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
    const browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    const driver: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
}
