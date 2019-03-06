/// <reference types="webdriverio/webdriverio-core"/>

type BrowserObject = WebDriver.ClientOptions & WebDriver.ClientAsync & WebdriverIOAsync.Browser;

// Element commands that should be wrapper with Promise
type ElementPromise = Omit<WebdriverIO.Element, 'addCommand'>;

// Element commands wrapper with Promise
type ElementAsync = {
    [K in keyof ElementPromise]: WrapWithPromise<ElementPromise[K], ReturnType<ElementPromise[K]>>
}
// Element commands that should not be wrapper with promise
type ElementStatic = Pick<WebdriverIO.Element, 'addCommand'>

// Browser commands that should be wrapper with Promise
type BrowserPromise = Omit<WebdriverIO.Browser, 'addCommand' | 'options'>;

// Browser commands wrapper with Promise
type BrowserAsync = {
    [K in keyof BrowserPromise]: WrapWithPromise<BrowserPromise[K], ReturnType<BrowserPromise[K]>>
}

// Browser commands that should not be wrapper with promise
type BrowserStatic = Pick<WebdriverIO.Browser, 'addCommand' | 'options'>;
declare namespace WebdriverIOAsync {
    function remote(
        options?: WebDriver.Options,
        modifier?: (...args: any[]) => any
    ): BrowserObject;

    function multiremote(
        options: WebdriverIO.MultiRemoteOptions
    ): WebDriver.ClientAsync;

    interface Browser extends BrowserAsync, BrowserStatic { }
    interface Element extends ElementAsync, ElementStatic { }
}

declare var browser: BrowserObject;
declare function $(selector: string | Function): Promise<WebdriverIOAsync.Element>;
declare function $$(selector: string | Function): Promise<WebdriverIOAsync.Element[]>;

declare module "webdriverio" {
    export = WebdriverIOAsync
}
