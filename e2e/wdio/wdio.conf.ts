import path from 'node:path'

import DevtoolsService from '../../packages/wdio-devtools-service/build/index.js'

export const config = {
    /**
     * specify test files
     */
    specs: [path.resolve(__dirname, 'headless', '*.e2e.ts')],

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
    logLevel: 'trace',
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
