/// <reference types="./webdriverio"/>

type ElementAsync = {
    [K in keyof WebdriverIO.Element]: WrapWithPromise<WebdriverIO.Element[K]>
}
type BrowserAsync = {
    [K in keyof WebdriverIO.Browser]: WrapWithPromise<WebdriverIO.Browser[K]>
}

declare namespace WebdriverIOAsync {
    interface Browser extends BrowserAsync { }
    interface Element extends ElementAsync { }
}

declare var browser: WebDriver.ClientAsync & WebdriverIOAsync.Browser;
declare function $(selector: string | Function): Promise<WebdriverIOAsync.Element>;
declare function $$(selector: string | Function): Promise<WebdriverIOAsync.Element[]>;

declare module "webdriverio" {
    export = WebdriverIOAsync
}
