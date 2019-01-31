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
        parsed: {
            hex: string,
            alpha: number,
            type: string,
            rgba: string
        }
    }

    interface Options {
        runner?: string,
        specs?: string[],
        exclude?: string[],
        suites?: object,
        maxInstances?: number,
        maxInstancesPerCapability?: number,
        capabilities?: WebDriver.DesiredCapabilities | WebDriver.DesiredCapabilities[],
        outputDir?: string,
        baseUrl?: string,
        bail?: number,
        waitforTimeout?: number,
        waitforInterval?: number,
        framework?: string,
        mochaOpts?: object,
        jasmineNodeOpts?: object,
        reporters?: (string | object)[],
        services?: (string | object)[],
        execArgv?: string[]
    }

    interface Hooks {

        onPrepare?(
            config: Config,
            capabilities: WebDriver.DesiredCapabilities
        ): void;

        onComplete?(exitCode: number): void;

        onReload?(oldSessionId: string, newSessionId: string): void;

        before?(
            capabilities: WebDriver.DesiredCapabilities,
            specs: string[]
        ): void;

        beforeCommand?(
            commandName: string,
            args: any[]
        ): void;

        beforeHook?(): void;

        beforeSession?(
            config: Config,
            capabilities: WebDriver.DesiredCapabilities,
            specs: string[]
        ): void;

        beforeSuite?(suite: Suite): void;
        beforeTest?(test: Test): void;
        afterHook?(): void;

        after?(
            result: number,
            capabilities: WebDriver.DesiredCapabilities,
            specs: string[]
        ): void;

        afterCommand?(
            commandName: string,
            args: any[],
            result: any,
            error?: Error
        ): void;

        afterSession?(
            config: Config,
            capabilities: WebDriver.DesiredCapabilities,
            specs: string[]
        ): void;

        afterSuite?(suite: Suite): void;
        afterTest?(test: Test): void;

        // cucumber specific hooks
        beforeFeature?(feature: string): void;
        beforeScenario?(scenario: string): void;
        beforeStep?(step: string): void;
        afterFeature?(feature: string): void;
        afterScenario?(scenario: any): void;
        afterStep?(stepResult: any): void;
    }

    interface Suite {
        file: string;
        parent: string;
        pending: boolean;
        title: string;
        type: string;
    }

    interface Test extends Suite {
        currentTest: string;
        passed: boolean;
        duration: any;
    }

    type ActionTypes = 'press' | 'longPress' | 'tap' | 'moveTo' | 'wait' | 'release';
    interface TouchAction {
        action: ActionTypes,
        x?: number,
        y?: number,
        element?: Element<void>
    }
    type TouchActions = string | TouchAction | TouchAction[];

    interface Element<T> {
        addCommand(
            name: string,
            func: Function
        ): undefined;
        // ... element commands ...
    }

    type Execute = <T>(script: string | ((...arguments: any[]) => T), ...arguments: any[]) => T;
    type ExecuteAsync = (script: string | ((...arguments: any[]) => any), ...arguments: any[]) => any;
    type Call = <T>(callback: Function) => T;
    interface Timeouts {
        implicit?: number,
        pageLoad?: number,
        script?: number
    }

    interface Browser<T> {
        addCommand(
            name: string,
            func: Function,
            attachToElement?: boolean
        ): undefined;
        execute: Execute;
        executeAsync: ExecuteAsync;
        call: Call;
        options: Options;
        waitUntil(
            condition: () => boolean,
            timeout?: number,
            timeoutMsg?: string,
            interval?: number
        ): undefined
        // ... browser commands ...
    }

    type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

    type Config = Options & Omit<WebDriver.Options, "capabilities"> & Hooks;
}

declare var browser: WebDriver.Client<void> & WebdriverIO.Browser<void>;
declare function $(selector: string | Function): WebdriverIO.Element<void>;
declare function $$(selector: string | Function): WebdriverIO.Element<void>[];

declare module "webdriverio" {
    export = WebdriverIO
}
