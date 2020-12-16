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
        options: MultiRemoteOptions,
        config?: { automationProtocol?: string }
    ): Promise<MultiRemoteBrowserObject>;

    interface Browser {
        strategies: Map<string, () => WebDriver.ElementReference | WebDriver.ElementReference[]>
        __propertiesObject__: Record<string, PropertyDescriptor>
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
        execute: {
            <T, U extends any[], V extends U>(script: string | ((...arguments: V) => T), ...arguments: U): Promise<T>;
            // This overload can be removed when typescript supports partial generics inference: https://github.com/microsoft/TypeScript/issues/26242
            <T>(script: string | ((...arguments: any[]) => T), ...arguments: any[]): Promise<T>;
        };

        // there is no way to add callback as last parameter after `...args`.
        // https://github.com/Microsoft/TypeScript/issues/1360
        // executeAsync: <T>(script: string | ((...arguments: any[], callback: (result: T) => void) => void), ...arguments: any[]) => Promise<T>;
        /**
         * Inject a snippet of JavaScript into the page for execution in the context of the currently selected frame.
         * The executed script is assumed to be asynchronous and must signal that is done by invoking
         * the provided callback, which is always provided as the final argument to the function. The value
         * to this callback will be returned to the client.
         */
        executeAsync: <U extends any[], V extends U>(script: string | ((...arguments: V) => void), ...arguments: U) => Promise<any>;
    }


    interface BrowserObject extends WebDriver.ClientOptions, WebDriver.ClientAsync, Browser {
    }

    interface MultiRemoteBrowser extends WebDriver.ClientOptions, WebDriver.ClientAsync, Browser {
    }

    /**
     * Error to be thrown when a severe error was encountered when a Service is being ran.
     */
    class SevereServiceError extends Error { }
}

declare var browser: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject;
declare var driver: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject;

/**
 * internal flags
 */
declare var _HAS_FIBER_CONTEXT: boolean

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
