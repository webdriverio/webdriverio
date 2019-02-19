/// <reference types="./webdriverio"/>

declare namespace WebdriverIOSync {
    type browser = WebDriver.Client & WebdriverIO.Browser;
    type $ = (selector: string | Function) => WebdriverIO.Element;
    type $$ = (selector: string | Function) => WebdriverIO.Element[];
}


declare module "webdriverio/sync" {
    export = WebdriverIOSync
}
