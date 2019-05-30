/// <reference types="webdriverio/webdriverio-core"/>

type BrowserObject = WebDriver.ClientOptions & WebDriver.ClientAsync & WebdriverIOAsync.Browser;
type $ = (selector: string | Function) => Promise<WebdriverIOAsync.Element>;
type $$ = (selector: string | Function) => Promise<WebdriverIOAsync.Element[]>;

// Element commands that should be wrapper with Promise
type ElementPromise = WdioOmit<WebdriverIO.Element, 'addCommand' | '$' | '$$'>;

// Methods which return async element(s) so non-async equivalents cannot just be promise-wrapped
interface AsyncSelectors {
    $: $;
    $$: $$;
}

// Element commands wrapper with Promise
type ElementAsync = {
    [K in keyof ElementPromise]: WrapWithPromise<ElementPromise[K], ReturnType<ElementPromise[K]>>
} & AsyncSelectors;

// Element commands that should not be wrapper with promise
type ElementStatic = Pick<WebdriverIO.Element, 'addCommand'>

// Browser commands that should be wrapper with Promise
type BrowserPromise = WdioOmit<WebdriverIO.Browser, 'addCommand' | 'options' | '$' | '$$'>;

// Browser commands wrapper with Promise
type BrowserAsync = {
    [K in keyof BrowserPromise]: WrapWithPromise<BrowserPromise[K], ReturnType<BrowserPromise[K]>>
} & AsyncSelectors;

// Browser commands that should not be wrapper with promise
type BrowserStatic = Pick<WebdriverIO.Browser, 'addCommand' | 'options'>;
declare namespace WebdriverIOAsync {
    function remote(
        options?: WebDriver.Options & WebdriverIO.Options,
        modifier?: (...args: any[]) => any
    ): BrowserObject;

    function attach(
        options?: WebDriver.AttachSessionOptions,
    ): BrowserObject;

    function multiremote(
        options: WebdriverIO.MultiRemoteOptions
    ): WebDriver.ClientAsync;

    interface Browser extends BrowserAsync, BrowserStatic {
        waitUntil(
            condition: () => Promise<boolean>,
            timeout?: number,
            timeoutMsg?: string,
            interval?: number
        ): Promise<boolean>
    }

    interface Element extends ElementAsync, ElementStatic { }
    interface Config {}
}

declare var browser: BrowserObject;
declare var $: $;
declare var $$: $$;

declare module "webdriverio" {
    export = WebdriverIOAsync
}
