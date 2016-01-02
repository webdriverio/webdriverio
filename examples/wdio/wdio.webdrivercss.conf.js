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
        './examples/wdio/runner-specs/webdrivercss.js'
    ],
    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome'
    }, {
        browserName: 'firefox'
    }],

    plugins: {
        webdrivercss: {
            screenshotRoot: 'visual/reference',
            failedComparisonsRoot: 'visual/failed',
            misMatchTolerance: 0.05,
            screenWidth: [1024]
        }
    },

    /**
     * test configurations
     */
    screenshotPath: 'shots',
    baseUrl: 'https://github.com',
    waitforTimeout: 10000,
    framework: 'mocha',

    reporters: ['dot'],

};
