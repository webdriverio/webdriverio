const path = require('node:path')
const CustomReporter = require('./reporter/my.custom.reporter.js')

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

    reporters: [[CustomReporter, {
        someOption: 'foobar'
    }]],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
