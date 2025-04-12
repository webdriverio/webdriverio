import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    reporters: [
        'dot',
        ['junit', {
            outputDir: './testresults/'
        }]
    ],
    // ...
})