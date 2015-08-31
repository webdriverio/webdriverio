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
    baseUrl: 'http://webdriver.io',
    waitforTimeout: 10000,
    framework: 'cucumber',

    reporter: 'spec',
    reporterOptions: {
        outputDir: './'
    },

    cucumberOpts: {
        require: ['./examples/runner-specs/cucumber/step-definitions.js']
    },

    /**
     * hooks
     */
    onPrepare: function() {
        console.log('let\'s go');
    },
    onComplete: function() {
        console.log('that\'s it');
    }

};