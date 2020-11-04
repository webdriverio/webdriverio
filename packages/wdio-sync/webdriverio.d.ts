/// <reference types="@wdio/sync/webdriverio-core"/>

declare namespace WebdriverIO {
    interface Browser {
        /**
         * execute any async action within your test spec
         */
        call: <T>(callback: (...args: any[]) => Promise<T>) => T;

        /**
         * Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame.
         * The executed script is assumed to be synchronous and the result of evaluating the script is returned to
         * the client.
         */
        execute: {
            <T, U extends any[], V extends U>(script: string | ((...arguments: V) => T), ...arguments: U): T;
            // This overload can be removed when typescript supports partial generics inference: https://github.com/microsoft/TypeScript/issues/26242
            <T>(script: string | ((...arguments: any[]) => T), ...arguments: any[]): T;
        };

        // also there is no way to add callback as last parameter after `...args`.
        // https://github.com/Microsoft/TypeScript/issues/1360
        // executeAsync: <T>(script: string | ((...arguments: any[], callback: (result: T) => void) => void), ...arguments: any[]) => T;
        /**
         * Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame.
         * The executed script is assumed to be asynchronous and must signal that is done by invoking
         * the provided callback, which is always provided as the final argument to the function. The value
         * to this callback will be returned to the client.
         */
        executeAsync: <U extends any[], V extends U>(script: string | ((...arguments: V) => void), ...arguments: U) => any;
    }

    interface BrowserObject extends WebDriver.ClientOptions, WebDriver.Client, WebdriverIO.Browser { }
    interface MultiRemoteBrowser extends WebDriver.ClientOptions, WebDriver.Client, WebdriverIO.Browser { }
}

declare var browser: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject;
declare var driver: WebdriverIO.BrowserObject;

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
