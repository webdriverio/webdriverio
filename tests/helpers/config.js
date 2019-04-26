exports.config = {
    /**
     * server configurations
     */
    hostname: 'localhost',
    port: 4444,
    path: '/',

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome'
    }],

    /**
     * test configurations
     */
    logLevel: 'trace',
    coloredLogs: true,
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec'],
    services: ['webdriver-mock'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 10000,
        compilers: ['js:@babel/register']
    },

    cucumberOpts: {
        timeout: 5000,
        compiler: ['js:@babel/register'],
        require: ['./tests/cucumber/step-definitions/*.js']
    }
}
