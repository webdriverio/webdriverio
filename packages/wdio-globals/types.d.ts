type ExpectType = import('expect-webdriverio').Expect

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
declare var multiremotebrowser: WebdriverIO.MultiRemoteBrowser
declare var browser: WebdriverIO.Browser
declare var driver: WebdriverIO.Browser
declare var expect: ExpectType

/**
 * custom environment primitives for WebdriverIO when running in a browser
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
