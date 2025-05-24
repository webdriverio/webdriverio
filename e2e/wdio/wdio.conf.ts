import url from 'node:url'
import path from 'node:path'

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
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        browserVersion: 'stable',
        // 'goog:chromeOptions': {
        //     args: ['headless', 'disable-gpu']
        // }
    }],
    bail: 1,
    services: ['lighthouse'],

    /**
     * test configurations
     */
    logLevel: 'info',
    maskingPatterns: '/--port=([^ ]*)/',
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}
