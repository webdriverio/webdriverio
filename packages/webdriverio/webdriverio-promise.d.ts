/// <reference types="./webdriverio"/>

type ArgumentTypes<T> = T extends (...args: infer U) => infer R ? U : never;
type WrapWithPromise<T> = (...args: ArgumentTypes<T>) => Promise<[T]>;

type ElementPromise = {
    [K in keyof WebdriverIO.Element]: WrapWithPromise<WebdriverIO.Element[K]>
}
type BrowserPromise = {
    [K in keyof WebdriverIO.Browser]: WrapWithPromise<WebdriverIO.Browser[K]>
}

declare namespace WebdriverIOPromise {
    type browser = WebDriver.Client & Browser;
    type $ = (selector: string | Function) => Promise<Element>;
    type $$ = (selector: string | Function) => Promise<Element[]>;
    
    interface Browser extends BrowserPromise { }
    interface Element extends ElementPromise { }
}

declare module "webdriverio/promise" {
    export = WebdriverIOPromise
}
