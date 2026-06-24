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
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        browserVersion: 'stable',
        'goog:chromeOptions': {
            args: [
                'disable-infobars'
                // 'headless', 'disable-gpu'
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

    /**
     * Several headless specs load third-party sites (e.g. the-internet.herokuapp.com,
     * guinea-pig.webdriver.io); a transient cold-start/network blip there fails the
     * spec through no fault of WebdriverIO. Retry the whole spec file so a flaky
     * external dependency doesn't redden the run. Matches wdio.local.conf.ts.
     * (wdio-multiremote.conf.ts inherits this via `...baseConfig`.)
     */
    specFileRetries: 3,

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    },
    maxInstances: os.cpus().length - 1
}
