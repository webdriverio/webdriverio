import path from 'node:path'
import url from 'node:url'
import CustomReporter from './my.custom.reporter.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

export const config = {
    /**
     * specify test files
     */
    specs: [path.resolve(__dirname, 'mocha.test.js')],

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
    framework: 'mocha',

    reporters: [[CustomReporter, {
        someOption: 'foobar'
    }]],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
