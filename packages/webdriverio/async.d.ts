type BrowserSync = import('./build/types').Browser<'async'>
type ElementSync = import('./build/types').Element<'async'>
type MultiRemoteBrowserSync = import('./build/types').MultiRemoteBrowser<'async'>

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

declare function $(...args: Parameters<WebdriverIO.Browser['$']>): WebdriverIO.Element
declare function $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
declare const browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
declare const driver: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
