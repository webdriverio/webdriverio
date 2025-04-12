import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    framework: 'jasmine',
    jasmineOpts: {
        defaultTimeoutInterval: 20000
    },
    // ...
})