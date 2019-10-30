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
        ): Element[];
        $(
            selector: string | Function
        ): Element;
        addValue(
            value: string | number | boolean | object | any[]
        ): void;
        clearValue(): void;
        click(
            options?: object
        ): void;
        doubleClick(): void;
        dragAndDrop(
            target: Element,
            duration?: number
        ): void;
        getAttribute(
            attributeName: string
        ): string;
        getCSSProperty(
            cssProperty: string
        ): CSSProperty;
        getHTML(
            includeSelectorTag?: boolean
        ): string;
        getLocation(
            prop: LocationParam
        ): number;
        getLocation(): LocationReturn;
        getProperty(
            property: string
        ): object | string;
        getSize(
            prop: SizeParam
        ): number;
        getSize(): SizeReturn;
        getTagName(): string;
        getText(): string;
        getValue(): string;
        isClickable(): boolean;
        isDisplayed(): boolean;
        isDisplayedInViewport(): boolean;
        isEnabled(): boolean;
        isExisting(): boolean;
        isFocused(): boolean;
        isSelected(): boolean;
        moveTo(
            xoffset?: number,
            yoffset?: number
        ): void;
        react$$(
            selector: string,
            props?: object,
            state?: any[] | number | string | object | boolean
        ): Element[];
        react$(
            selector: string,
            props?: object,
            state?: any[] | number | string | object | boolean
        ): Element;
        saveScreenshot(
            filename: string
        ): Buffer;
        scrollIntoView(
            scrollIntoViewOptions?: object | boolean
        ): void;
        selectByAttribute(
            attribute: string,
            value: string
        ): void;
        selectByIndex(
            index: number
        ): void;
        selectByVisibleText(
            text: string
        ): void;
        setValue(
            value: string | number | boolean | object | any[]
        ): void;
        shadow$$(
            selector: string | Function
        ): Element[];
        shadow$(
            selector: string | Function
        ): Element;
        touchAction(
            action: TouchActions
        ): void;
        waitForDisplayed(
            ms?: number,
            reverse?: boolean,
            error?: string
        ): boolean;
        waitForEnabled(
            ms?: number,
            reverse?: boolean,
            error?: string
        ): boolean;
        waitForExist(
            ms?: number,
            reverse?: boolean,
            error?: string
        ): boolean;
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
        ): Element[];
        $(
            selector: string | Function | object
        ): Element;
        debug(): void;
        deleteCookies(
            names?: string[]
        ): void;
        getCookies(
            names?: string[]
        ): Cookie[];
        getWindowSize(): WebDriver.RectReturn;
        keys(
            value: string | string[]
        ): void;
        newWindow(
            url: string,
            windowName?: string,
            windowFeatures?: string
        ): string;
        pause(
            milliseconds: number
        ): void;
        react$$(
            selector: string,
            props?: object,
            state?: any[] | number | string | object | boolean
        ): Element[];
        react$(
            selector: string,
            props?: object,
            state?: any[] | number | string | object | boolean
        ): Element;
        reloadSession(): void;
        saveRecordingScreen(
            filepath: string
        ): Buffer;
        saveScreenshot(
            filepath: string
        ): Buffer;
        setCookies(
            cookie: Cookie
        ): void;
        setTimeout(
            timeouts: Timeouts
        ): void;
        setWindowSize(
            width: number,
            height: number
        ): null | object;
        switchWindow(
            urlOrTitleToMatch: string | RegExp
        ): void;
        touchAction(
            action: TouchActions
        ): void;
        uploadFile(
            localPath: string
        ): string;
        url(
            url?: string
        ): void;
    }

    interface Config extends Options, Omit<WebDriver.Options, "capabilities">, Hooks {}
}
