import url from 'node:url'
import path from 'node:path'
import os from 'node:os'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config: WebdriverIO.Config = {
    /**
     * specify test files
     */
    specs: [
        path.join(__dirname, 'headless', 'puppeteer.e2e.ts'),
        path.join(__dirname, 'headless', 'source-maps.e2e.ts'),
        path.join(__dirname, 'headless', 'reloadSession.e2e.ts'),
        path.join(__dirname, 'headless', 'test.e2e.ts'),
        path.join(__dirname, 'headless', 'mocking.e2e.ts'),
        path.join(__dirname, 'headless', 'a11yStrict.e2e.ts'),
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        browserVersion: 'stable',
        'goog:chromeOptions': {
            args: [
                '--headless=new',
                '--no-sandbox',
                '--disable-dev-shm-usage'
            ]
        }
    }],
    bail: 1,
    services: ['lighthouse'],

    /**
     * test configurations
     */
    logLevel: 'info',
    //maskingPatterns: '/--port=([^ ]*)/', // Uncomment to test masking in logs
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    maxInstances: os.cpus().length - 1
}
