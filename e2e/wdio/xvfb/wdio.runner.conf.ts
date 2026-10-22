import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * Runs runner.e2e.ts through the local runner. With no DISPLAY in the container,
 * the runner spawns each worker through `xvfb-run`.
 */
export const config: WebdriverIO.Config = {
    specs: [
        path.join(__dirname, 'runner.e2e.ts')
    ],

    /** No --headless, so the session needs the display xvfb-run gives the worker. */
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage'
            ],
            ...(process.env.CHROME_BIN && { binary: process.env.CHROME_BIN })
        }
    }],

    logLevel: 'info',
    framework: 'mocha',
    outputDir: path.join(__dirname, 'logs'),

    runner: 'local',
    autoXvfb: true,

    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 120000
    },
}
