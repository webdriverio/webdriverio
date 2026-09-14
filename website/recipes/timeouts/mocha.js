import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    framework: 'mocha',
    mochaOpts: {
        timeout: 20000
    },
    // ...
})