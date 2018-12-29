/// <reference types="node"/>
/// <reference types="webdriver"/>

declare namespace WebdriverIO {
    function remote(
        options: any,
        modifier: any
    ): WebDriver.Client<void>;

    function multiremote(
        options: any
    ): WebDriver.Client<void>;

    interface Element<T> {
        // ... element commands ...
    }

    interface Browser<T> {
        addCommand(
            name: string,
            func: Function
        ): any;
        // ... browser commands ...
    }
}

declare var browser: WebDriver.Client<void> & WebdriverIO.Browser<void>;
declare function $(selector: string): WebdriverIO.Element<void>;
declare function $$(selector: string): WebdriverIO.Element<void>[];

declare module "webdriverio" {
    export = WebdriverIO
}