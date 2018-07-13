const path = require('path')
const CustomReporter = require('./reporter/my.custom.reporter');

exports.config = {
    /**
     * server configurations
     */
    hostname: '0.0.0.0',
    port: 4444,

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
    logDir: __dirname,
    framework: 'mocha',

    reporters: [[CustomReporter, {
        someOption: 'foobar'
    }]],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
