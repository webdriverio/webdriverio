exports.config = {

    /**
     * server configurations
     */
    host: '0.0.0.0',
    port: 4444,

    /**
     * specify test files
     */
    specs: [
        './examples/wdio/runner-specs/mocha.multiremote.test.js'
    ],
    exclude: [
        'test/spec/multibrowser/**',
        'test/spec/mobile/**'
    ],

    /**
     * capabilities
     */
    capabilities: {
        browserA: {
            desiredCapabilities: {
                browserName: 'chrome'
            }
        },
        browserB: {
            desiredCapabilities: {
                browserName: 'chrome'
            }
        }
    },

    /**
     * test configurations
     */
    logLevel: 'silent',
    coloredLogs: true,
    screenshotPath: 'shots',
    baseUrl: 'http://chat.socket.io',
    waitforTimeout: 10000,
    framework: 'mocha',

    reporters: ['dot'],
    reporterOptions: {
        outputDir: './'
    },

    mochaOpts: {
        ui: 'bdd'
    }

};
