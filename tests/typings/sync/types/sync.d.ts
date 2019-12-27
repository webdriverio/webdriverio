/**
 * An example of adding command withing d.ts file with @wdio/sync
 */

// module should be "@wdio/sync" if used within `ts` file instead of `d.ts`
declare module WebdriverIO {
    interface Browser {
        browserCustomCommand: (arg: unknown) => void
    }
}
