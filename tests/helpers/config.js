import path from 'node:path'
import url from 'node:url'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config = {
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
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec'],
    services: ['webdriver-mock'],
    execArgv: ['--expose-gc'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 10000,
        grep: 'SKIPPED_GREP',
        invert: true
    },

    jasmineOpts: {
        defaultTimeoutInterval: 1000 * 60 * 3,
        grep: 'SKIPPED_GREP',
        invertGrep: true,
        require: ['tsx'],
    },

    cucumberOpts: {
        timeout: 5000,
        requireModule: ['tsx'],
        require: [path.resolve(__dirname, '..', 'cucumber', 'step-definitions', '*.js')]
    }
}
