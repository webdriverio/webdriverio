/// <reference types="webdriverio/webdriverio-core"/>

type $ = (selector: string | Function) => Promise<WebdriverIOAsync.Element>;
type $$ = (selector: string | Function) => Promise<WebdriverIOAsync.Element[]>;

// Element commands that should be wrapper with Promise
type ElementPromise = Omit<WebdriverIO.Element,
    'addCommand'
    | '$'
    | '$$'
    | 'selector'
    | 'elementId'
    | 'element-6066-11e4-a52e-4f735466cecf'
    | 'ELEMENT'
    | 'dragAndDrop'
    | 'touchAction'
>;

// Methods which return async element(s) so non-async equivalents cannot just be promise-wrapped
interface AsyncSelectors {
    $: $;
    $$: $$;
}

// Element commands wrapper with Promise
type ElementAsync = {
    [K in keyof ElementPromise]:
    (...args: Parameters<ElementPromise[K]>) => Promise<ReturnType<ElementPromise[K]>>;
} & AsyncSelectors;

// Element commands that should not be wrapper with promise
type ElementStatic = Pick<WebdriverIO.Element,
    'addCommand'
    | 'selector'
    | 'elementId'
    | 'element-6066-11e4-a52e-4f735466cecf'
    | 'ELEMENT'
>;

// Browser commands that should be wrapper with Promise
type BrowserPromise = Omit<WebdriverIO.Browser, 'addCommand' | 'overwriteCommand' | 'options' | '$' | '$$' | 'touchAction'>;

// Browser commands wrapper with Promise
type BrowserAsync = {
    [K in keyof BrowserPromise]:
    (...args: Parameters<BrowserPromise[K]>) => Promise<ReturnType<BrowserPromise[K]>>;
} & AsyncSelectors;

// Browser commands that should not be wrapper with promise
type BrowserStatic = Pick<WebdriverIO.Browser, 'addCommand' | 'overwriteCommand' | 'options'>;

// Properties of TouchAction which are similar in sync and async mode
type TouchActionSync = Omit<WebdriverIO.TouchAction, 'element'>

declare namespace WebdriverIOAsync {
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
    interface TouchAction extends TouchActionSync {
        element?: Element
    }
    type TouchActions = string | TouchAction | TouchAction[];
    interface Browser extends BrowserAsync, BrowserStatic {
        waitUntil(
            condition: () => Promise<boolean>,
            timeout?: number,
            timeoutMsg?: string,
            interval?: number
        ): Promise<boolean>;

        // there is no way to wrap generic functions, like `<T>(arg: T) => T`
        // have to declare explicitly for sync and async typings.
        // https://github.com/microsoft/TypeScript/issues/5453
        call: <T>(callback: (...args: any[]) => Promise<T>) => Promise<T>;
        execute: <T>(script: string | ((...arguments: any[]) => T), ...arguments: any[]) => Promise<T>;

        // also there is no way to add callback as last parameter after `...args`.
        // https://github.com/Microsoft/TypeScript/issues/1360
        // executeAsync: <T>(script: string | ((...arguments: any[], callback: (result: T) => void) => void), ...arguments: any[]) => Promise<T>;
        executeAsync: (script: string | ((...arguments: any[]) => void), ...arguments: any[]) => Promise<any>;
        touchAction(action: TouchActions): Promise<void>;
    }

    interface Element extends ElementAsync, ElementStatic {
        dragAndDrop(target: Element, duration?: number): Promise<void>;
        touchAction(action: TouchActions): Promise<void>;
    }
    interface Config { }

    interface BrowserObject extends WebDriver.ClientOptions, WebDriver.ClientAsync, WebdriverIOAsync.Browser { }
}

declare var browser: WebdriverIOAsync.BrowserObject;
declare var $: $;
declare var $$: $$;

declare module "webdriverio" {
    export = WebdriverIOAsync
}
