import url from 'node:url'
import path from 'node:path'

import DevtoolsService from '../../packages/wdio-devtools-service/build/index.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config = {
    /**
     * specify test files
     */
    specs: [path.join(__dirname, 'headless', '*.e2e.ts')],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        'wdio:devtoolsOptions': { headless: true, dumpio: true }
    }],

    services: [[DevtoolsService, {}]],

    /**
     * test configurations
     */
    logLevel: 'info',
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
