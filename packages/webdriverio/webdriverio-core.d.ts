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
        waitforTimeout?: number,
        waitforInterval?: number,
        framework?: string,
        mochaOpts?: object,
        jasmineNodeOpts?: object,
        reporters?: (string | object)[],
        services?: (string | object)[],
        execArgv?: string[]
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
        afterHook?(test: any, context: any, result: { error?: any, result?: any, passed: boolean, duration: number }, stepData?: any, world?: any): void;

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
        afterTest?(test: Test, context: any, result: { error?: any, result?: any, passed: boolean, duration: number }): void;
    }
    type _HooksArray = {
        [K in keyof Pick<HookFunctions, "onPrepare" | "onComplete" | "before" | "after" | "beforeSession" | "afterSession">]: HookFunctions[K] | Array<HookFunctions[K]>;
    };
    type _Hooks = Omit<HookFunctions, "onPrepare" | "onComplete" | "before" | "after" | "beforeSession" | "afterSession">;
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

    interface Element {
        "element-6066-11e4-a52e-4f735466cecf"?: string;
        ELEMENT?: string;
        selector: string;
        elementId: string;
        addCommand(
            name: string,
            func: Function
        ): void;
        $$(
            selector: string | Function
        ): Promise<Element[]>;
        $(
            selector: string | Function
        ): Promise<Element>;
        addValue(
            value: string | number | boolean | object | any[]
        ): Promise<void>;
        clearValue(): Promise<void>;
        click(
            options?: object
        ): Promise<void>;
        doubleClick(): Promise<void>;
        dragAndDrop(
            target: Element,
            duration?: number
        ): Promise<void>;
        getAttribute(
            attributeName: string
        ): Promise<string>;
        getCSSProperty(
            cssProperty: string
        ): Promise<CSSProperty>;
        getHTML(
            includeSelectorTag?: boolean
        ): Promise<string>;
        getLocation(
            prop: LocationParam
        ): Promise<number>;
        getLocation(): Promise<LocationReturn>;
        getProperty(
            property: string
        ): Promise<object | string>;
        getSize(
            prop: SizeParam
        ): Promise<number>;
        getSize(): Promise<SizeReturn>;
        getTagName(): Promise<string>;
        getText(): Promise<string>;
        getValue(): Promise<string>;
        isClickable(): Promise<boolean>;
        isDisplayed(): Promise<boolean>;
        isDisplayedInViewport(): Promise<boolean>;
        isEnabled(): Promise<boolean>;
        isExisting(): Promise<boolean>;
        isFocused(): Promise<boolean>;
        isSelected(): Promise<boolean>;
        moveTo(
            xoffset?: number,
            yoffset?: number
        ): Promise<void>;
        react$$(
            selector: string,
            props?: object,
            state?: any[] | number | string | object | boolean
        ): Promise<Element[]>;
        react$(
            selector: string,
            props?: object,
            state?: any[] | number | string | object | boolean
        ): Promise<Element>;
        saveScreenshot(
            filename: string
        ): Promise<Buffer>;
        scrollIntoView(
            scrollIntoViewOptions?: object | boolean
        ): Promise<void>;
        selectByAttribute(
            attribute: string,
            value: string
        ): Promise<void>;
        selectByIndex(
            index: number
        ): Promise<void>;
        selectByVisibleText(
            text: string
        ): Promise<void>;
        setValue(
            value: string | number | boolean | object | any[]
        ): Promise<void>;
        shadow$$(
            selector: string | Function
        ): Promise<Element[]>;
        shadow$(
            selector: string | Function
        ): Promise<Element>;
        touchAction(
            action: TouchActions
        ): Promise<void>;
        waitForDisplayed(
            ms?: number,
            reverse?: boolean,
            error?: string
        ): Promise<boolean>;
        waitForEnabled(
            ms?: number,
            reverse?: boolean,
            error?: string
        ): Promise<boolean>;
        waitForExist(
            ms?: number,
            reverse?: boolean,
            error?: string
        ): Promise<boolean>;
    }

    interface Timeouts {
        implicit?: number,
        pageLoad?: number,
        script?: number
    }

    interface Browser {
        config: Config;
        addCommand(
            name: string,
            func: Function,
            attachToElement?: boolean
        ): void;
        overwriteCommand(
            name: string,
            func: (origCommand: Function, ...args: any[]) => any,
            attachToElement?: boolean
        ): void;
        options: RemoteOptions;
        $$(
            selector: string | Function
        ): Promise<Element[]>;
        $(
            selector: string | Function | object
        ): Promise<Element>;
        debug(): Promise<void>;
        deleteCookies(
            names?: string[]
        ): Promise<void>;
        getCookies(
            names?: string[]
        ): Promise<Cookie[]>;
        getWindowSize(): Promise<WebDriver.RectReturn>;
        keys(
            value: string | string[]
        ): Promise<void>;
        newWindow(
            url: string,
            windowName?: string,
            windowFeatures?: string
        ): Promise<string>;
        pause(
            milliseconds: number
        ): Promise<void>;
        react$$(
            selector: string,
            props?: object,
            state?: any[] | number | string | object | boolean
        ): Promise<Element[]>;
        react$(
            selector: string,
            props?: object,
            state?: any[] | number | string | object | boolean
        ): Promise<Element>;
        reloadSession(): Promise<void>;
        saveRecordingScreen(
            filepath: string
        ): Promise<Buffer>;
        saveScreenshot(
            filepath: string
        ): Promise<Buffer>;
        setCookies(
            cookie: Cookie
        ): Promise<void>;
        setTimeout(
            timeouts: Timeouts
        ): Promise<void>;
        setWindowSize(
            width: number,
            height: number
        ): Promise<null | object>;
        switchWindow(
            urlOrTitleToMatch: string | RegExp
        ): Promise<void>;
        touchAction(
            action: TouchActions
        ): Promise<void>;
        uploadFile(
            localPath: string
        ): Promise<string>;
        url(
            url?: string
        ): Promise<void>;
    }

    interface Config extends Options, Omit<WebDriver.Options, "capabilities">, Hooks {}
}
