import url from 'node:url'
import path from 'node:path'
import type { Options } from '@wdio/types'

import DevtoolsService from '../../packages/wdio-devtools-service/build/index.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config: Options.Testrunner = {
    /**
     * specify test files
     */
    specs: [path.join(__dirname, 'headless', '*.e2e.ts')],
    exclude: [path.join(__dirname, 'headless', 'multiremoteTest.e2e.ts')],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        browserVersion: 'stable',
        'wdio:devtoolsOptions': { headless: true, dumpio: true }
    }],
    bail: 1,
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
