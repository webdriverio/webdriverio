type BrowserType = import('webdriverio').Browser
type ElementType = import('webdriverio').Element
type ElementArrayType = import('webdriverio').ElementArray
type MultiRemoteBrowserType = import('webdriverio').MultiRemoteBrowser
type MultiRemoteElementType = import('webdriverio').MultiRemoteElement
type ExpectType = import('expect-webdriverio').Expect

declare namespace WebdriverIO {
    interface Browser extends BrowserType { }
    interface Element extends ElementType { }
    interface ElementArray extends ElementArrayType { }
    interface MultiRemoteBrowser extends MultiRemoteBrowserType { }
    interface MultiRemoteElement extends MultiRemoteElementType { }
}

declare module NodeJS {
    interface Global {
        multiremotebrowser: WebdriverIO.MultiRemoteBrowser
        browser: WebdriverIO.Browser
        driver: WebdriverIO.Browser
        expect: ExpectType
    }
}

declare function $(...args: Parameters<WebdriverIO.Browser['$']>): ReturnType<WebdriverIO.Browser['$']>
declare function $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
declare var browser: WebdriverIO.Browser
declare var driver: WebdriverIO.Browser
declare var multiremotebrowser: WebdriverIO.MultiRemoteBrowser
