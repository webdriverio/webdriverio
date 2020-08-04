const path = require('path')

exports.config = {
    /**
     * server configurations
     */
    hostname: 'localhost',

    /**
     * specify test files
     */
    specs: [path.resolve(__dirname, 'mocha.test.js')],

    /**
     * capabilities
     */
    capabilities: {
        browserA: {
            port: 4444,
            capabilities: {
                browserName: 'chrome'
            }
        },
        browserB: {
            port: 4445,
            capabilities: {
                browserName: 'chrome'
            }
        }
    },

    /**
     * test configurations
     */
    logLevel: 'trace',
    outputDir: __dirname,
    framework: 'mocha',

    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 1000 * 60 * 3
    }
}
