/// <reference types="webdriverio/webdriverio-core"/>

declare namespace WebdriverIO {
    function remote(
        options?: RemoteOptions,
        modifier?: (...args: any[]) => any
    ): Promise<BrowserObject>;

    function attach(
        options: WebDriver.AttachSessionOptions,
    ): BrowserObject;

    function multiremote(
        options: MultiRemoteOptions
    ): Promise<BrowserObject>;

    type ElementReferenceId = 'element-6066-11e4-a52e-4f735466cecf'
    type ElementReference = Record<ElementReferenceId, string>

    interface Browser {
        emit: Function
        strategies: Map<string, () => ElementReference | ElementReference[]>
        puppeteer?: any

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

    interface BrowserObject extends WebDriver.ClientOptions, WebDriver.ClientAsync, Browser { }

    /**
     * Error to be thrown when a severe error was encountered when a Service is being ran.
     */
    class SevereServiceError extends Error { }
}

declare var browser: WebdriverIO.BrowserObject;
declare var driver: WebdriverIO.BrowserObject;

/**
 * find a single element on the page.
 */
declare var $: (selector: string | Function) => Promise<WebdriverIO.Element>;

/**
 * find multiple elements on the page.
 */
declare var $$: (selector: string | Function) => Promise<WebdriverIO.ElementArray>;

declare module "webdriverio" {
    export = WebdriverIO
}
