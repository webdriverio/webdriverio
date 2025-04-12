import { defineConfig } from '@wdio/config'

const debug = process.env.DEBUG

export const config = defineConfig({
    // ...
    execArgv: debug ? ['--inspect'] : [],
    maxInstances: debug ? 1 : 100,
    capabilities: debug ? [{ browserName: 'chrome' }] : [{ browserName: 'firefox' }],
    jasmineOpts: {
        defaultTimeoutInterval: debug ? (24 * 60 * 60 * 1000) : 5000
    }
    // ...
})