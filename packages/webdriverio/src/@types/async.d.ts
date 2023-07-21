/**
 * This file need to WebdriverIO has its independent type definitions
 * and does not require @wdio/globals to be available. This seems to be
 * the only feasable way to avoid cyclic dependencies between webdriverio
 * and @wdio/globals
 */

type BrowserImport = import('../types.js').Browser
type ElementImport = import('../types.js').Element
type MultiRemoteBrowserImport = import('../types.js').MultiRemoteBrowser

declare namespace WebdriverIO {
    interface Browser extends BrowserImport { }
    interface Element extends ElementImport { }
    interface MultiRemoteBrowser extends MultiRemoteBrowserImport { }
}

declare module NodeJS {
    interface Global {
        multiremotebrowser: WebdriverIO.MultiRemoteBrowser
        browser: WebdriverIO.Browser
        driver: WebdriverIO.Browser
    }
}

declare function $(...args: Parameters<WebdriverIO.Browser['$']>): WebdriverIO.Element
declare function $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
declare const browser: WebdriverIO.Browser
declare const driver: WebdriverIO.Browser
declare const multiremotebrowser: WebdriverIO.MultiRemoteBrowser
