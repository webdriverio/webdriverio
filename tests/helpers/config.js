exports.config = {
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
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec'],
    services: ['webdriver-mock'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 10000,
        require: ['ts-node/register'],
        grep: 'SKIPPED_GREP',
        invert: true
    },

    jasmineNodeOpts: {
        defaultTimeoutInterval: 1000 * 60 * 3,
        grep: 'SKIPPED_GREP',
        invertGrep: true,
        require: ['ts-node/register']
    },

    cucumberOpts: {
        timeout: 5000,
        requireModule: ['ts-node/register'],
        require: ['./tests/cucumber/step-definitions/*.js']
    },
}
