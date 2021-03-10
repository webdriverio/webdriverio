type BrowserSync = import('./build/types').Browser<'async'>
type ElementSync = import('./build/types').Element<'async'>
type MultiRemoteBrowserAsync = import('./build/types').MultiRemoteBrowser<'async'>
type ElementArrayImport = import('./build/types').ElementArray

declare namespace WebdriverIOAsync {
    interface Browser {}
    interface Element {}
    interface MultiRemoteBrowser {}
}

declare namespace WebdriverIO {
    interface Browser extends BrowserSync, WebdriverIOAsync.Browser { }
    interface Element extends ElementSync, WebdriverIOAsync.Element { }
    // @ts-expect-error
    interface MultiRemoteBrowser extends MultiRemoteBrowserAsync, WebdriverIOAsync.MultiRemoteBrowser { }
    interface ElementArray extends ElementArrayImport {}
}

declare function $(...args: Parameters<WebdriverIO.Browser['$']>): ReturnType<WebdriverIO.Browser['$']>
declare function $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
declare const browser: WebdriverIO.Browser
declare const driver: WebdriverIO.Browser
declare const multiremotebrowser: WebdriverIO.MultiRemoteBrowser
