const path = require('path')

exports.config = {
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
        browserName: 'firefox',
        'goog:chromeOptions': { headless: true }
    }],

    /**
     * test configurations
     */
    logLevel: 'trace',
    framework: 'mocha',
    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
