import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    mochaOpts: {
        ui: 'tdd',
        // provide a setup script to run in the browser
        require: './__fixtures__/setup.js'
    },
    // ...
})