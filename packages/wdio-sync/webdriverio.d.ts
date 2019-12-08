/// <reference types="@wdio/sync/webdriverio-core"/>

declare namespace WebdriverIO {
    interface Browser {
        /**
         * waits until the condition is fulfilled with a truthy value
         */
        waitUntil(
            condition: () => boolean,
            timeout?: number,
            timeoutMsg?: string,
            interval?: number
        ): boolean

        /**
         * execute any async action within your test spec
         */
        call: <T>(callback: (...args: any[]) => Promise<T>) => T;

        /**
         * Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame.
         * The executed script is assumed to be synchronous and the result of evaluating the script is returned to
         * the client.
         */
        execute: <T>(script: string | ((...arguments: any[]) => T), ...arguments: any[]) => T;

        // also there is no way to add callback as last parameter after `...args`.
        // https://github.com/Microsoft/TypeScript/issues/1360
        // executeAsync: <T>(script: string | ((...arguments: any[], callback: (result: T) => void) => void), ...arguments: any[]) => T;
        /**
         * Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame.
         * The executed script is assumed to be asynchronous and must signal that is done by invoking
         * the provided callback, which is always provided as the final argument to the function. The value
         * to this callback will be returned to the client.
         */
        executeAsync: (script: string | ((...arguments: any[]) => void), ...arguments: any[]) => any;
    }

    interface BrowserObject extends WebDriver.ClientOptions, WebDriver.Client, WebdriverIO.Browser { }
}

declare var browser: WebdriverIO.BrowserObject;

/**
 * find a single element on the page.
 */
declare function $(selector: string | Function): WebdriverIO.Element;

/**
 * find multiple elements on the page.
 */
declare function $$(selector: string | Function): WebdriverIO.ElementArray;

declare module "@wdio/sync" {
    export = WebdriverIO
}
