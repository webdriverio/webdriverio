const path = require('node:path')

exports.config = {

    /**
     * specify test files
     */
    specs: [[path.resolve(__dirname, '*.spec.js')]],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        acceptInsecureCerts: true,
        'wdio:devtoolsOptions': {
            headless: true
        }
    }],

    /**
     * test configurations
     */
    logLevel: 'trace',
    outputDir: __dirname,
    framework: 'jasmine',

    reporters: ['spec'],

    jasmineOpts: {
        defaultTimeoutInterval: 1000 * 60 * 3
    },

    /**
     * hooks
     */
    onPrepare: function() {
        // eslint-disable-next-line
        console.log('let\'s go');
    },
    onComplete: function() {
        // eslint-disable-next-line
        console.log('that\'s it');
    }
}
