/**
 * This file need to WebdriverIO has its independent type definitions
 * and does not require @wdio/globals to be available. This seems to be
 * the only feasable way to avoid cyclic dependencies between webdriverio
 * and @wdio/globals
 */

import type { Browser as BrowserImport } from '../types.js'
import type { Element as ElementImport } from '../types.js'
import type { MultiRemoteBrowser as MultiRemoteBrowserImport } from '../types.js'

declare global {
    namespace WebdriverIO {
        interface Browser extends BrowserImport { }
        interface Element extends ElementImport { }
        interface MultiRemoteBrowser extends MultiRemoteBrowserImport { }
    }

    namespace NodeJS {
        interface Global {
            multiremotebrowser: WebdriverIO.MultiRemoteBrowser
            browser: WebdriverIO.Browser
            driver: WebdriverIO.Browser
        }
    }

    function $(...args: Parameters<WebdriverIO.Browser['$']>): WebdriverIO.Element
    function $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
    const browser: WebdriverIO.Browser
    const driver: WebdriverIO.Browser
    const multiremotebrowser: WebdriverIO.MultiRemoteBrowser

    /**
    * custom environment primitives for WebdriverIO when running in a browser implemented
    * as part of the `@wdio/browser-runner` package.
    * @see `packages/wdio-browser-runner/src/browser/driver.ts`
    */
    var wdio: {
        /**
         * This command is available when running WebdriverIO tests using `@wdio/browser-runner`.
         * It allows you to execute a command in Node.js land if desired.
         * @param command The command to execute
         * @param args The arguments to pass to the command
         * @returns The result of the command
         */
        execute: <CommandName extends keyof BrowserElement>(command: CommandName, ...args: unknown[]) => ReturnType<BrowserElement[CommandName]>
        /**
        * This command is available when running WebdriverIO tests using `@wdio/browser-runner`.
        * It allows you to execute a command in Node.js land if desired.
        * @param command The command to execute
        * @param scope The element id when the command needs to be executed from an element scope
        * @param args The arguments to pass to the command
        * @returns The result of the command
        */
        executeWithScope: <CommandName extends keyof BrowserElement>(commandName: CommandName, scope: string, ...args: unknown[]) => ReturnType<BrowserElement[CommandName]>
    }
}

type BrowserElement = WebdriverIO.Browser & WebdriverIO.Element
