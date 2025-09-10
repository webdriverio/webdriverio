import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config = {
    /**
     * specify test files
     */
    specs: [
        './general.test.js',
        './general2.test.js',
        './general3.test.js',
    ],

    exclude: [
        'general2',
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
    }],

    /**
     * test configurations
     */
    logLevel: 'trace',
    framework: 'mocha',
    outputDir: __dirname,

    services: ['webdriver-mock'],
    reporters: ['spec', 'dot', 'junit'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 15000
    },

    /**
     * hooks
     */
    onPrepare: function() {
        console.log('let\'s go')
    },
    onComplete: function() {
        console.log('that\'s it')
    }
}
