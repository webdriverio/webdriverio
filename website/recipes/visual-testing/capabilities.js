import path from 'node:path'
import { defineConfig } from '@wdio/config'

export const config = defineConfig({
    // ...
    capabilities: [
        {
            browserName: 'chrome',
            'wdio-ics:options': {
                logName: 'chrome-mac-15', // Custom log name for Chrome
            },
        },
        {
            browserName: 'firefox',
            'wdio-ics:options': {
                logName: 'firefox-mac-15', // Custom log name for Firefox
            },
        }
    ],
    services: [
        [
            'visual',
            {
                // Some options, see the docs for more
                baselineFolder: path.join(process.cwd(), 'tests', 'baseline'),
                screenshotPath: path.join(process.cwd(), 'tmp'),
                // The format below will use the `logName` from capabilities
                formatImageName: '{tag}-{logName}-{width}x{height}',
                // ... more options
            },
        ],
    ],
    // ...
})