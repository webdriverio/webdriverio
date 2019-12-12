const path = require('path')

exports.config = {
    /**
     * server configurations
     */
    hostname: 'localhost',
    port: 4444,

    /**
     * specify test files
     */
    specs: [path.resolve(__dirname, 'mocha.test.js')],

    /**
     * capabilities
     */
    capabilities: {
        browserA: {
            capabilities: {
                browserName: 'chrome'
            }
        },
        browserB: {
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
