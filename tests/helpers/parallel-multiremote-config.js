import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config = {
    /**
     * capabilities
     */
    capabilities: [{
        browserA: {
            capabilities: { browserName: 'chrome' }
        },
        browserB: {
            capabilities: { browserName: 'chrome' }
        }
    },
    {
        browserC: {
            capabilities: { browserName: 'chrome' }
        },
        browserD: {
            capabilities: { browserName: 'chrome' }
        }
    }
    ],

    /**
     * test configurations
     */
    logLevel: 'trace',
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec'],
    services: ['webdriver-mock'],
}
