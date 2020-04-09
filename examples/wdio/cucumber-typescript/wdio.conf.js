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
        __dirname + '/src/features/*.feature'
    ],

    maxInstances: 1,
    maxInstancesPerCapability: 1,

    /**
     * capabilities
     */
    capabilities: [{
        maxInstances: 5,
        browserName: 'chrome'
    }],

    /**
     * test configurations
     */
    logLevel: 'error',
    framework: 'cucumber',

    reporters: ['spec'],

    cucumberOpts: {
        requireModule: [
            'tsconfig-paths/register',
            () => { require('ts-node').register({ files: true, transpileOnly: true }) },
        ],
        require: [__dirname + '/src/step-definitions.ts']
    }
}
