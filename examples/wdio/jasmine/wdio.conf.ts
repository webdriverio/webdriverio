import path from 'node:path'
import url from 'node:url'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config: WebdriverIO.Config = {

    /**
     * specify test files
     */
    specs: [[path.resolve(__dirname, '*.spec.ts')]],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome'
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
