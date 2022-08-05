type BrowserType = import('webdriverio').Browser<'async'>
type ElementType = import('webdriverio').Element<'async'>
type MultiRemoteBrowserType = import('webdriverio').MultiRemoteBrowser<'async'>

declare namespace WebdriverIOAsync {
    interface Browser {}
    interface Element {}
    interface MultiRemoteBrowser {}
}

declare namespace WebdriverIO {
    interface Browser extends BrowserType, WebdriverIOAsync.Browser { }
    interface Element extends ElementType, WebdriverIOAsync.Element { }
    // @ts-expect-error
    interface MultiRemoteBrowser extends MultiRemoteBrowserType, WebdriverIOAsync.MultiRemoteBrowser { }
}

declare module NodeJS {
    interface Global {
        browser: WebdriverIO.Browser
        driver: WebdriverIO.Browser
        multiremotebrowser: WebdriverIO.MultiRemoteBrowser
    }
}

declare function $(...args: Parameters<WebdriverIO.Browser['$']>): ReturnType<WebdriverIO.Browser['$']>
declare function $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
declare const browser: WebdriverIO.Browser
declare const driver: WebdriverIO.Browser
declare const multiremotebrowser: WebdriverIO.MultiRemoteBrowser
