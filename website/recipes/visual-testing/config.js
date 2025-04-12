import path from 'node:path'

import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    services: [
        [
            'visual',
            {
                // Some options, see the docs for more
                baselineFolder: path.join(process.cwd(), 'tests', 'baseline'),
                formatImageName: '{tag}-{logName}-{width}x{height}',
                screenshotPath: path.join(process.cwd(), 'tmp'),
                savePerInstance: true,
                // ... more options
            },
        ],
    ],
    // ...
})