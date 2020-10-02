const path = require('path')

exports.config = {
    /**
     * specify test files
     */
    specs: [
        path.resolve(__dirname, 'devicefarm.test.js')
    ],

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
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec', 'dot', 'junit'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 5000
    },

    /**
     * device farm service configurations
     */
    services: [['devicefarm', {
        projectArn: process.env.PROJECT_ARN
    }]],

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
