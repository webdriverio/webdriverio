import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    framework: 'cucumber',
    cucumberOpts: {
        timeout: 20000
    },
    // ...
})