const path = require('path')

exports.config = {
    /**
     * server configurations
     */
    hostname: '0.0.0.0',
    port: 4444,

    /**
     * specify test files
     */
    specs: [
        path.resolve(__dirname, './features/*.feature'),
    ],
    maxInstances: 5,
    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        maxInstances: 1
    }],

    /**
     * test configurations
     */
    logLevel: 'debug',
    outputDir: path.resolve(__dirname, './logs'),
    framework: 'cucumber',

    reporters: ['dot', 'spec'],
    cucumberOpts: {
        require: [path.resolve(__dirname, './step-definitions.js')],
        ignoreUndefinedDefinitions: false
    }
}
