/**
 * This file need to WebdriverIO has its independent type definitions
 * and does not require @wdio/globals to be available. This seems to be
 * the only feasable way to avoid cyclic dependencies between webdriverio
 * and @wdio/globals
 */

type BrowserSync = import('../types.js').Browser<'async'>
type ElementSync = import('../types.js').Element<'async'>
type MultiRemoteBrowserSync = import('../types.js').MultiRemoteBrowser<'async'>

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
