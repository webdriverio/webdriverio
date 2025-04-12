import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    filesToWatch: [
        // watch for all JS files in my app
        './src/app/**/*.js'
    ],
    // ...
})