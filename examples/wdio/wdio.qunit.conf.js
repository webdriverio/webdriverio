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
        './examples/wdio/runner-specs/qunit.test.js'
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
    framework: 'qunit',

    reporter: 'dot',
    reporterOptions: {
        outputDir: './'
    },


    /**
     * hooks
     */
    onPrepare: function() {
        console.log('let\'s go');
    },
    before: function() {
        // GLOBAL.QUnit available for setting config & callbacks
    },
    onComplete: function() {
        console.log('that\'s it');
    }

};
