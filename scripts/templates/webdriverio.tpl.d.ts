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

    type LocationParam = 'x' | 'y';

    interface LocationReturn {
        x: number,
        y: number
    }

    type SizeParam = 'width' | 'height';

    interface SizeReturn {
        width: number,
        height: number
    }

    interface Cookie {
        name: string,
        value: string,
        path?: string,
        expiry?: number,
    }

    interface Cookie {
        name: string,
        value: string,
        domain?: string
        path?: string,
        expiry?: number,
        isSecure?: boolean,
        isHttpOnly?: boolean
    }

    interface CSSProperty {
        property: string,
        value: any,
        parse: {
            type: string,
            string: string,
            unit: string,
            value: any
        }
    }

    interface Options {
        specs?: string[],
        exclude?: string[],
        suites?: object,
        capabilities: DesiredCapabilities[],
        outputDir?: string,
        baseUrl?: string,
        bail?: number,
        waitforTimeout?: number,
        waitforInterval?: number,
        framework?: string,
        mochaOpts?: object,
        jasmineNodeOpts?: object,
        reporters?: string[] | object[],
        services?: string[] | object[],
        execArgv?: string[]
    }

    interface Element<T> {
        // ... element commands ...
    }

    type Execute = <T>(script: string | ((...arguments: any[]) => T), ...arguments: any[]) => T;
    type ExecuteAsync = (script: string | ((...arguments: any[]) => any), ...arguments: any[]) => any;

    interface Browser<T> {
        addCommand(
            name: string,
            func: Function
        ): any;
        execute: Execute;
        executeAsync: ExecuteAsync;
        options: Options;
        waitUntil(
            condition: Function,
            timeout?: number,
            timeoutMsg?: string,
            interval?: number
        ): undefined
        // ... browser commands ...
    }
}

declare var browser: WebDriver.Client<void> & WebdriverIO.Browser<void>;
declare function $(selector: string | Function): WebdriverIO.Element<void>;
declare function $$(selector: string | Function): WebdriverIO.Element<void>[];

declare module "webdriverio" {
    export = WebdriverIO
}
