/// <reference types="@wdio/sync/webdriverio-core"/>

type BrowserObject = WebDriver.ClientOptions & WebDriver.Client & WebdriverIO.Browser;

declare namespace WebdriverIO {
    function remote(
        options?: WebDriver.Options,
        modifier?: (...args: any[]) => any
    ): BrowserObject;

    function multiremote(
        options: WebdriverIO.MultiRemoteOptions
    ): WebDriver.Client;
}

declare var browser: BrowserObject;
declare function $(selector: string | Function): WebdriverIO.Element;
declare function $$(selector: string | Function): WebdriverIO.Element[];

declare module "@wdio/sync" {
    export = WebdriverIO
}
