const path = require('node:path')
const CustomService = require('./my.custom.service.js')

exports.config = {
    /**
     * specify test files
     */
    specs: [path.resolve(__dirname, 'mocha.test.js')],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome'
    }],

    /**
     * test configurations
     */
    logLevel: 'trace',
    outputDir: __dirname,
    framework: 'mocha',

    services: [[CustomService, {
        someOption: 'foobar'
    }]],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
