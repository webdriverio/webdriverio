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
    logLevel: 'silent',
    framework: 'cucumber',

    reporters: ['dot'],

    cucumberOpts: {
        require: ['./step-definitions.js']
    }
};
