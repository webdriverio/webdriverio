import url from 'node:url'
import path from 'node:path'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config: WebdriverIO.Config = {
    runner: ['local', {
        useSingleProcess: false
    }],

    maxInstances: 2,

    /**
     * specify test files
     */
    specs: [
        path.resolve(__dirname, 'features', '*.feature')
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
        require: [path.resolve(__dirname, 'step-definitions.ts')]
    }
}
