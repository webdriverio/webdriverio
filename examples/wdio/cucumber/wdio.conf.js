exports.config = {
    /**
     * server configurations
     */
    hostname: 'localhost',
    port: 4444,

    /**
     * specify test files
     */
    specs: [
        './features/*.feature'
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

    reporters: ['dot'],

    cucumberOpts: {
        require: ['./step-definitions.js']
    }
}
