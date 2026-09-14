import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    capabilities: [{
        browserName: 'chrome',
        'custom:caps': {
            // custom configurations
        }
    }]
})