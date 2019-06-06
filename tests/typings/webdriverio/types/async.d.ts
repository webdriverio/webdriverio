/**
 * An example of adding command withing d.ts file to WebdriverIOAsync
 */

// module should be "webdriverio" if used within `ts` file instead of `d.ts`
declare module WebdriverIOAsync {
    interface BrowserObject {
        // multiremote
        instances: ['myBrowserInstance']
        myBrowserInstance: BrowserObject
    }

    interface Element {
        elementCustomCommand: (arg: unknown) => Promise<number>
    }
}
