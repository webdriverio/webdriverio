import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config: WebdriverIO.Config = {
    /**
     * specify test files
     */
    specs: [
        path.join(__dirname, 'headless', 'classic.e2e.ts')
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        browserVersion: 'stable',
        'wdio:enforceWebDriverClassic': true,
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
    }],
    bail: 1,

    /**
     * test configurations
     */
    logLevel: 'info',
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec'],

    /**
     * Retry the whole spec file so a transient third-party-site blip (the headless
     * specs load external pages) doesn't redden the run. Matches wdio.local.conf.ts.
     */
    specFileRetries: 3,

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
