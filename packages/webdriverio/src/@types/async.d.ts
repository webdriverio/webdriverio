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

/**
 * custom environment primitives for WebdriverIO when running in a browser implemented
 * as part of the `@wdio/browser-runner` package.
 * @see `packages/wdio-browser-runner/src/browser/driver.ts`
 */
declare var wdio: {
    /**
     * This command is available when running WebdriverIO tests using `@wdio/browser-runner`.
     * It allows you to execute a command in Node.js land if desired.
     * @param command The command to execute
     * @param args The arguments to pass to the command
     * @returns The result of the command
     */
    execute: <CommandName>(command: CommandName, ...args: any[]) => ReturnType<WebdriverIO.Browser[CommandName]>
    /**
     * This command is available when running WebdriverIO tests using `@wdio/browser-runner`.
     * It allows you to execute a command in Node.js land if desired.
     * @param command The command to execute
     * @param scope The element id when the command needs to be executed from an element scope
     * @param args The arguments to pass to the command
     * @returns The result of the command
     */
    executeWithScope: <CommandName>(commandName: CommandName, scope: string, ...args: any[]) => ReturnType<WebdriverIO.Browser[CommandName]>
}
