/// <reference types="../webdriverio"/>

declare var browser: WebDriver.Client & WebdriverIO.Browser;
declare function $(selector: string | Function): WebdriverIO.Element;
declare function $$(selector: string | Function): WebdriverIO.Element[];

declare module "webdriverio/sync" {
    export = WebdriverIO
}
