const path = require('node:path')

exports.config = {
    /**
     * specify test files
     */
    specs: [
        path.resolve(__dirname, '*.test.tsx'),
        path.resolve(__dirname, '*.test.js')
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        acceptInsecureCerts: true,
        // 'wdio:devtoolsOptions': { headless: true }
    // }, {
    //     browserName: 'chrome',
    //     acceptInsecureCerts: true,
    //     'wdio:devtoolsOptions': { headless: true }
    }],

    /**
     * test configurations
     */
    logLevel: 'trace',
    framework: 'mocha',
    outputDir: __dirname,
    runner: 'browser',

    reporters: ['spec', 'dot', 'junit'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 150000
    },

    /**
     * hooks
     */
    onPrepare: function() {
        // eslint-disable-next-line
        console.log('let\'s go')
    },
    onComplete: function() {
        // eslint-disable-next-line
        console.log('that\'s it')
    }
}
