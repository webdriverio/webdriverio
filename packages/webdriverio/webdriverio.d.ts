/// <reference types="webdriverio/webdriverio-core"/>

declare namespace WebdriverIO {
    function remote(
        options?: WebdriverIO.RemoteOptions,
        modifier?: (...args: any[]) => any
    ): BrowserObject;

    function attach(
        options: WebDriver.AttachSessionOptions,
    ): BrowserObject;

    function multiremote(
        options: WebdriverIO.MultiRemoteOptions
    ): BrowserObject;

    interface Browser {
        /**
         * waits until the condition is fulfilled with a truthy value
         */
        waitUntil(
            condition: () => Promise<boolean>,
            timeout?: number,
            timeoutMsg?: string,
            interval?: number
        ): Promise<boolean>;

        /**
         * execute any async action within your test spec
         */
        call: <T>(callback: (...args: any[]) => Promise<T>) => Promise<T>;

        /**
         * Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame.
         * The executed script is assumed to be synchronous and the result of evaluating the script is returned to
         * the client.
         */
        execute: <T>(script: string | ((...arguments: any[]) => T), ...arguments: any[]) => Promise<T>;

        // there is no way to add callback as last parameter after `...args`.
        // https://github.com/Microsoft/TypeScript/issues/1360
        // executeAsync: <T>(script: string | ((...arguments: any[], callback: (result: T) => void) => void), ...arguments: any[]) => Promise<T>;
        /**
         * Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame.
         * The executed script is assumed to be asynchronous and must signal that is done by invoking
         * the provided callback, which is always provided as the final argument to the function. The value
         * to this callback will be returned to the client.
         */
        executeAsync: (script: string | ((...arguments: any[]) => void), ...arguments: any[]) => Promise<any>;
    }

    interface BrowserObject extends WebDriver.ClientOptions, WebDriver.ClientAsync, WebdriverIO.Browser { }
}

type $ = (selector: string | Function) => Promise<WebdriverIO.Element>;
type $$ = (selector: string | Function) => Promise<WebdriverIO.Element[]>;

declare var browser: WebdriverIO.BrowserObject;

/**
 * find a single element on the page.
 */
declare var $: $;

/**
 * find multiple elements on the page.
 */
declare var $$: $$;

declare module "webdriverio" {
    export = WebdriverIO
}
