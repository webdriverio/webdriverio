type BrowserType = import('webdriverio').Browser<'async'>
type ElementType = import('webdriverio').Element<'async'>
type ElementArrayType = import('webdriverio').ElementArray
type MultiRemoteBrowserType = import('webdriverio').MultiRemoteBrowser<'async'>
type ExpectType = import('expect-webdriverio').Expect

declare namespace WebdriverIOAsync {
    interface Browser {}
    interface Element {}
    interface ElementArray {}
    interface MultiRemoteBrowser {}
}

declare namespace WebdriverIO {
    interface Browser extends BrowserType, WebdriverIOAsync.Browser { }
    interface Element extends ElementType, WebdriverIOAsync.Element { }
    interface ElementArray extends ElementArrayType, WebdriverIOAsync.ElementArray { }
    // @ts-expect-error
    interface MultiRemoteBrowser extends MultiRemoteBrowserType, WebdriverIOAsync.MultiRemoteBrowser { }
}

declare module NodeJS {
    interface Global {
        browser: WebdriverIO.Browser
        driver: WebdriverIO.Browser
        multiremotebrowser: WebdriverIO.MultiRemoteBrowser
        expect: ExpectType
    }
}

declare function $(...args: Parameters<WebdriverIO.Browser['$']>): ReturnType<WebdriverIO.Browser['$']>
declare function $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
declare var browser: WebdriverIO.Browser
declare var driver: WebdriverIO.Browser
declare var multiremotebrowser: WebdriverIO.MultiRemoteBrowser
