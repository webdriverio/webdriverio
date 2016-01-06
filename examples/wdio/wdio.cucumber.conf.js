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
        './examples/wdio/runner-specs/cucumber/features/*.feature'
    ],
    exclude: [
        'test/spec/multibrowser/**',
        'test/spec/mobile/**'
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'phantomjs'
    }, {
        browserName: 'chrome'
    }, {
        browserName: 'firefox'
    }],

    /**
     * test configurations
     */
    logLevel: 'silent',
    coloredLogs: true,
    screenshotPath: 'shots',
    waitforTimeout: 10000,
    framework: 'cucumber',

    reporters: ['dot'],
    reporterOptions: {
        outputDir: './'
    },

    cucumberOpts: {
        require: ['./examples/wdio/runner-specs/cucumber/step-definitions.js']
    }
};
