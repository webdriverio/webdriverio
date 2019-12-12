const path = require('path')

exports.config = {
    /**
     * run tests with devtools
     */
    automationProtocol: 'devtools',

    /**
     * specify test files
     */
    specs: [path.resolve(__dirname, '*.e2e.js')],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': { headless: true }
    }, {
        browserName: 'chrome',
        'goog:chromeOptions': { headless: true }
    }, {
        browserName: 'chrome',
        'goog:chromeOptions': { headless: true }
    }, {
        browserName: 'chrome',
        'goog:chromeOptions': { headless: true }
    }],

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
