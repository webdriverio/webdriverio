/// <reference types="@wdio/sync/webdriverio-core"/>

declare namespace WebdriverIO {
    interface Browser {
        waitUntil(
            condition: () => boolean,
            timeout?: number,
            timeoutMsg?: string,
            interval?: number
        ): boolean

        // there is no way to wrap generic functions, like `<T>(arg: T) => T`
        // have to declare explicitly for sync and async typings.
        // https://github.com/microsoft/TypeScript/issues/5453
        call: <T>(callback: (...args: any[]) => Promise<T>) => T;
        execute: <T>(script: string | ((...arguments: any[]) => T), ...arguments: any[]) => T;

        // also there is no way to add callback as last parameter after `...args`.
        // https://github.com/Microsoft/TypeScript/issues/1360
        // executeAsync: <T>(script: string | ((...arguments: any[], callback: (result: T) => void) => void), ...arguments: any[]) => T;
        executeAsync: (script: string | ((...arguments: any[]) => void), ...arguments: any[]) => any;
    }

    interface BrowserObject extends WebDriver.ClientOptions, WebDriver.Client, WebdriverIO.Browser { }
}

declare var browser: WebdriverIO.BrowserObject;
declare function $(selector: string | Function): WebdriverIO.Element;
declare function $$(selector: string | Function): WebdriverIO.Element[];

declare module "@wdio/sync" {
    export = WebdriverIO
}
