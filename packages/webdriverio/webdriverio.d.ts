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
        waitUntil(
            condition: () => Promise<boolean>,
            timeout?: number,
            timeoutMsg?: string,
            interval?: number
        ): Promise<boolean>;

        call: <T>(callback: (...args: any[]) => Promise<T>) => Promise<T>;
        execute: <T>(script: string | ((...arguments: any[]) => T), ...arguments: any[]) => Promise<T>;

        // also there is no way to add callback as last parameter after `...args`.
        // https://github.com/Microsoft/TypeScript/issues/1360
        // executeAsync: <T>(script: string | ((...arguments: any[], callback: (result: T) => void) => void), ...arguments: any[]) => Promise<T>;
        executeAsync: (script: string | ((...arguments: any[]) => void), ...arguments: any[]) => Promise<any>;
    }

    interface BrowserObject extends WebDriver.ClientOptions, WebDriver.ClientAsync, WebdriverIO.Browser { }
}

declare var browser: WebdriverIO.BrowserObject;

type $ = (selector: string | Function) => Promise<WebdriverIO.Element>;
type $$ = (selector: string | Function) => Promise<WebdriverIO.Element[]>;
declare var $: $;
declare var $$: $$;

declare module "webdriverio" {
    export = WebdriverIO
}
