exports.config = {

    /**
     * server configurations
     */
    host: '0.0.0.0',
    port: 4444,

    /**
     * service providers
     */
    user: 'webdriverio',
    key:  'xxxxxxxxxxxxxxxx-xxxxxx-xxxxx-xxxxxxxxx',
    updateJob: true,

    /**
     * specify test files
     */
    specs: [
        'test/spec/**'
    ],
    exclude: [
        'test/spec/multibrowser/**',
        'test/spec/mobile/**'
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome'
    }, {
        browserName: 'firefox',
        specs: [
            'test/ffOnly/*'
        ]
    },{
        browserName: 'phantomjs',
        exclude: [
            'test/spec/alert.js'
        ]
    }],

    /**
     * test configurations
     */
    logLevel: 'silent',
    coloredLogs: true,
    screenshotPath: 'shots',
    baseUrl: 'http://localhost:8080',
    waitforTimeout: 1000,
    framework: 'mocha',

    reporter: 'xunit',
    reporterOptions: {
        outputDir: './'
    },

    mochaOpts: {
        ui: 'bdd'
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