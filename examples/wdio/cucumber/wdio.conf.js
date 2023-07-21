exports.config = {
    /**
     * specify test files
     */
    specs: [
        ['./features/my-feature.feature']
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome'
    }],

    /**
     * test configurations
     */
    logLevel: 'error',
    framework: 'cucumber',

    reporters: ['spec'],

    cucumberOpts: {
        require: [__dirname + '/step-definitions.js']
    }
}
