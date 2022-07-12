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
    services: ['webdriver-mock', 'shared-store'],

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
        require: ['ts-node/esm']
    },

    cucumberOpts: {
        timeout: 5000,
        requireModule: ['ts-node/esm'],
        require: ['./tests/cucumber/step-definitions/*.js']
    },

    afterTest: async (test, context, { error }) => {
        if (!error) {
            return
        }

        const errorKey = `errors-${process.env.WDIO_WORKER_ID}`
        const errors = await browser.sharedStore.get(errorKey) || []
        await browser.sharedStore.set(errorKey, [...errors, JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))])
    },

    afterScenario: async (world, { error }) => {
        if (!error) {
            return
        }
        const errorKey = `errors-${process.env.WDIO_WORKER_ID}`
        const errors = await browser.sharedStore.get(errorKey) || []
        await browser.sharedStore.set(errorKey, [...errors, JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))])
    }
}
