const path = require('node:path')

exports.config = {
    /**
     * specify test files
     */
    specs: [
        path.resolve(__dirname, '*.test.tsx'),
        path.resolve(__dirname, '*.test.js')
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        acceptInsecureCerts: true
    }],

    /**
     * test configurations
     */
    logLevel: 'trace',
    framework: 'mocha',
    outputDir: __dirname,
    reporters: ['spec', 'dot', 'junit'],
    services: ['chromedriver'],
    runner: ['browser', {
        preset: process.env.WDIO_PRESET
    }],

    mochaOpts: {
        ui: 'bdd',
        timeout: 150000
    }
}
