exports.config = {
    /**
     * server configurations
     */
    hostname: '0.0.0.0',
    port: 4444,
    path: '/',

    /**
     * specify test files in your smoke test
     */
    specs: [],

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
    logDir: __dirname,

    reporters: ['spec'],
    services: ['webdriver-mock'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
        compilers: ['js:@babel/register']
    }
}
