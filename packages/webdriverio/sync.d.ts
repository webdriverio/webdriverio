type BrowserType = import('./build/types').Browser
type ElementType = import('./build/types').Element
type MultiRemoteBrowserType = import('./build/types').MultiRemoteBrowser
type BrowserCommandsTypeSync = import('./build/types').BrowserCommandsTypeSync
type ElementCommandsTypeSync = import('./build/types').ElementCommandsTypeSync
type ClientSync = import('webdriver').ClientSync

declare namespace WebdriverIO {
    // @ts-expect-error
    interface Browser extends BrowserType, BrowserCommandsTypeSync, Omit<ClientSync, 'options'>, WebdriverIOSync.Browser { }
    // @ts-expect-error
    interface Element extends ElementType, Omit<BrowserCommandsTypeSync, keyof ElementCommandsTypeSync>, ElementCommandsTypeSync, Omit<ClientSync, 'options'>, WebdriverIOSync.Element {
        $(...args: Parameters<WebdriverIO.Browser['$']>): WebdriverIO.Element
        $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
    }
    // @ts-expect-error
    interface MultiRemoteBrowser extends MultiRemoteBrowserType, BrowserCommandsTypeSync, Omit<ClientSync, 'sessionId' | 'options'>, WebdriverIOSync.MultiRemoteBrowser {
        (instanceName: string): WebdriverIO.Browser
    }
}

declare function $(...args: Parameters<WebdriverIO.Browser['$']>): WebdriverIO.Element
declare function $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
// @ts-expect-error
declare const browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
// @ts-expect-error
declare const driver: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
