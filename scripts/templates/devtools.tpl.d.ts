/// <reference types="node"/>
/// <reference types="webdriver"/>

declare namespace DevTools {
    interface ClientOptions extends WebDriver.ClientOptions {
        isDevTools: boolean;
        getPuppeteer: (...args: any[]) => any;
    }

    // generated typings
    // ... insert here ...
}

declare module "devtools" {
    export = DevTools;
}
