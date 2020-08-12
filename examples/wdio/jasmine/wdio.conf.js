const path = require('path')

exports.config = {

    /**
     * server configurations
     */
    hostname: 'localhost',
    port: 4444,

    /**
     * specify test files
     */
    specs: [path.resolve(__dirname, 'jasmine.spec.js')],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        acceptInsecureCerts: true
    }],

    /**
     * test configurations
     */
    logLevel: 'trace',
    outputDir: __dirname,
    framework: 'jasmine',

    reporters: ['spec'],

    jasmineNodeOpts: {
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
