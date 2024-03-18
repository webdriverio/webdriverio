type ExpectType = import('expect-webdriverio').Expect

declare module NodeJS {
    interface Global {
        multiremotebrowser: WebdriverIO.MultiRemoteBrowser
        browser: WebdriverIO.Browser
        driver: WebdriverIO.Browser
        expect: ExpectType
    }
}

declare function $(...args: Parameters<WebdriverIO.Browser['$']>): ReturnType<WebdriverIO.Browser['$']>
declare function $$(...args: Parameters<WebdriverIO.Browser['$$']>): ReturnType<WebdriverIO.Browser['$$']>
declare var multiremotebrowser: WebdriverIO.MultiRemoteBrowser
declare var browser: WebdriverIO.Browser
declare var driver: WebdriverIO.Browser
declare var expect: ExpectType
