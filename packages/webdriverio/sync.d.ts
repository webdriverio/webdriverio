type BrowserSync = import('./build/types').Browser<'sync'>
type ElementSync = import('./build/types').Element<'sync'>
type MultiRemoteBrowserSync = import('./build/types').MultiRemoteBrowser<'sync'>
type ElementArrayImport = import('./build/types').ElementArray

declare namespace WebdriverIOSync {
    interface Browser {}
    interface Element {}
    interface MultiRemoteBrowser {}
}

declare namespace WebdriverIO {
    interface Browser extends BrowserSync, WebdriverIOSync.Browser { }
    interface Element extends ElementSync, WebdriverIOSync.Element { }
    // @ts-expect-error
    interface MultiRemoteBrowser extends MultiRemoteBrowserSync, WebdriverIOSync.MultiRemoteBrowser { }
    interface ElementArray extends ElementArrayImport {}
}

declare function $(...args: Parameters<WebdriverIO.Browser['$']>): ReturnType<WebdriverIO.Browser['$']>
declare function $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
declare const browser: WebdriverIO.Browser
declare const driver: WebdriverIO.Browser
declare const multiremotebrowser: WebdriverIO.MultiRemoteBrowser
