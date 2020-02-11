/// <reference types="node"/>
/// <reference types="webdriver"/>

declare namespace WebdriverIO {
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
        domain?: string,
        path?: string,
        expiry?: number,
        isSecure?: boolean,
        isHttpOnly?: boolean
    }

    interface CSSProperty {
        property: string,
        value: any,
        parsed?: {
            // other
            unit?: string,
            // font-family
            value?: any,
            string: string,
            // color
            hex?: string,
            alpha?: number,
            type?: string,
            rgba?: string
        }
    }

    interface MultiRemoteCapabilities {
        [instanceName: string]: {
            capabilities: WebDriver.DesiredCapabilities;
        };
    }

    interface Options {
        runner?: string,
        specs?: string[],
        exclude?: string[],
        suites?: object,
        maxInstances?: number,
        maxInstancesPerCapability?: number,
        capabilities?: WebDriver.DesiredCapabilities[] | MultiRemoteCapabilities,
        outputDir?: string,
        baseUrl?: string,
        bail?: number,
        specFileRetries?: number,
        readonly specFileRetryAttempts?: number,
        waitforTimeout?: number,
        waitforInterval?: number,
        framework?: string,
        mochaOpts?: object,
        jasmineNodeOpts?: object,
        reporters?: (string | object)[],
        services?: (string | object)[],
        execArgv?: string[],
        featureFlags?: {
            specFiltering?: boolean,
        },
    }

    interface RemoteOptions extends WebDriver.Options, Omit<Options, 'capabilities'> { }

    interface MultiRemoteOptions {
        [instanceName: string]: WebDriver.DesiredCapabilities;
    }

    interface Suite {}
    interface Test {}

    interface Results {
        finished: number,
        passed: number,
        failed: number
    }

    interface HookFunctions {
        onPrepare?(
            config: Config,
            capabilities: WebDriver.DesiredCapabilities[]
        ): void;

        onWorkerStart?(
            cid: string,
            caps: WebDriver.DesiredCapabilities,
            specs: string[],
            args: Config,
            execArgv: string[]
        ): void;

        onComplete?(exitCode: number, config: Config, capabilities: WebDriver.DesiredCapabilities, results: Results): void;

        onReload?(oldSessionId: string, newSessionId: string): void;

        before?(
            capabilities: WebDriver.DesiredCapabilities,
            specs: string[]
        ): void;

        beforeCommand?(
            commandName: string,
            args: any[]
        ): void;

        beforeHook?(test: any, context: any, stepData?: any, world?: any): void;

        beforeSession?(
            config: Config,
            capabilities: WebDriver.DesiredCapabilities,
            specs: string[]
        ): void;

        beforeSuite?(suite: Suite): void;
        beforeTest?(test: Test, context: any): void;
        afterHook?(test: any, context: any, result: {
            error?: any,
            result?: any,
            passed: boolean,
            duration: number,
            retries: { limit: number, attempts: number }
        }, stepData?: any, world?: any): void;

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
        afterTest?(test: Test, context: any, result: {
            error?: any,
            result?: any,
            passed: boolean,
            duration: number,
            retries: { limit: number, attempts: number }
        }): void;
    }
    type _HooksArray = {
        [K in keyof Pick<HookFunctions, "onPrepare" | "onWorkerStart" | "onComplete" | "before" | "after" | "beforeSession" | "afterSession">]: HookFunctions[K] | Array<HookFunctions[K]>;
    };
    type _Hooks = Omit<HookFunctions, "onPrepare" | "onWorkerStart" | "onComplete" | "before" | "after" | "beforeSession" | "afterSession">;
    interface Hooks extends _HooksArray, _Hooks { }

    type ActionTypes = 'press' | 'longPress' | 'tap' | 'moveTo' | 'wait' | 'release';
    interface TouchAction {
        action: ActionTypes,
        x?: number,
        y?: number,
        element?: Element,
        ms?: number
    }
    type TouchActions = string | TouchAction | TouchAction[];

    type WaitForOptions = {
        timeout?: number,
        interval?: number,
        timeoutMsg?: string,
        reverse?: boolean,
    }

    type ReactSelectorOptions = {
        props?: object,
        state?: any[] | number | string | object | boolean
    }

    type MoveToOptions = {
        xOffset?: number,
        yOffset?: number
    }

    type DragAndDropOptions = {
        duration?: number
    }

    type NewWindowOptions = {
        windowName?: string,
        windowFeatures?: string
    }

    type ClickOptions = {
        button?: number | string,
        x?: number,
        y?: number
    }

    interface Element {
        selector: string;
        elementId: string;

        /**
         * w3c
         */
        "element-6066-11e4-a52e-4f735466cecf"?: string;

        /**
         * jsonwp
         */
        ELEMENT?: string;

        /**
         * index in array of elements
         * only applicable if the element found with `$$` command
         */
        index?: number;

        /**
         * WebdriverIO.Element or WebdriverIO.BrowserObject
         */
        parent: Element | WebdriverIO.BrowserObject;

        /**
         * add command to `element` scope
         */
        addCommand(
            name: string,
            func: Function
        ): void;
        // ... element commands ...
    }

    interface ElementArray extends Array<Element> {
        selector: string | Function;
        parent: Element | WebdriverIO.BrowserObject;
        foundWith: string;
        props: any[];
    }

    interface Timeouts {
        implicit?: number,
        pageLoad?: number,
        script?: number
    }

    interface Browser {
        config: Config;
        options: RemoteOptions;

        /**
         * add command to `browser` or `element` scope
         */
        addCommand(
            name: string,
            func: Function,
            attachToElement?: boolean
        ): void;

        /**
         * overwrite `browser` or `element` command
         */
        overwriteCommand(
            name: string,
            func: (origCommand: Function, ...args: any[]) => any,
            attachToElement?: boolean
        ): void;

        /**
         * create custom selector
         */
        addLocatorStrategy(
            name: string,
            func: (elementFetchingMethod: (selector: string) => any) => void
        ): void
        // ... browser commands ...
    }

    interface Config extends Options, Omit<WebDriver.Options, "capabilities">, Hooks {}
}
