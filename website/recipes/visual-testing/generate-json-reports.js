import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    services: [
        [
            'visual',
            {
                createJsonReportFiles: true, // Generates the output.json file
            },
        ],
    ],
})