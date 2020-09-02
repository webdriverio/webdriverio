/**
 * An example of adding command within d.ts file to WebdriverIO (async)
 */

// module should be "webdriverio" if used within `ts` file instead of `d.ts`
declare module WebdriverIO {
    interface BrowserObject {
        // multiremote
        instances: ['myBrowserInstance']
        myBrowserInstance: BrowserObject
    }

    interface Element {
        elementCustomCommand: (arg: unknown) => Promise<number>
    }
}
