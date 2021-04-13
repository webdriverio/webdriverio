const path = require('path')

const DevtoolsService = require('../../packages/wdio-devtools-service').default

exports.config = {
    /**
     * specify test files
     */
    specs: [path.resolve(__dirname, 'headless', '*.e2e.js')],

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
