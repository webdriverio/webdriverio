type BrowserSync = import('../types').Browser<'async'>
type ElementSync = import('../types').Element<'async'>
type MultiRemoteBrowserSync = import('../types').MultiRemoteBrowser<'async'>

declare namespace WebdriverIOAsync {
    interface Browser {}
    interface Element {}
    interface MultiRemoteBrowser {}
}

declare namespace WebdriverIO {
    interface Browser extends BrowserSync, WebdriverIOAsync.Browser { }
    interface Element extends ElementSync, WebdriverIOAsync.Element { }
    // @ts-expect-error
    interface MultiRemoteBrowser extends MultiRemoteBrowserSync, WebdriverIOAsync.MultiRemoteBrowser { }
}

declare module NodeJS {
    interface Global {
        browser: WebdriverIO.Browser
        multiremotebrowser: WebdriverIO.MultiRemoteBrowser
    }
}

declare function $(...args: Parameters<WebdriverIO.Browser['$']>): WebdriverIO.Element
declare function $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
declare const browser: WebdriverIO.Browser
declare const driver: WebdriverIO.Browser
declare const multiremotebrowser: WebdriverIO.MultiRemoteBrowser
