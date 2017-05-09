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
        './examples/wdio/runner-specs/jasmine.spec.js'
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
    framework: 'jasmine',

    reporters: ['dot'],
    reporterOptions: {
        outputDir: './'
    },

    jasmineNodeOpts: {
        defaultTimeoutInterval: 9999999
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
