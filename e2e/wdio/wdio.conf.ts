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
        path.join(__dirname, 'headless', 'shadowRootScope-repro.e2e.ts'),
        path.join(__dirname, 'headless', 'strictSelectors.e2e.ts'),
        path.join(__dirname, 'headless', 'setFiles.e2e.ts'),
        path.join(__dirname, 'headless', 'browsingContexts.e2e.ts'),
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        browserVersion: 'stable',
        'goog:chromeOptions': {
            args: [
                'disable-infobars',
                /**
                 * A headed Chrome gets real `mousemove` events from the OS
                 * cursor, for example on the Windows runner when the Chrome
                 * window of another worker opens or closes under it. These
                 * events move the pointer away from where `moveTo()` put it.
                 */
                'headless',
                'disable-gpu'
            ]
        }
    }],
    bail: 1,

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
    /**
     * Keep at least one worker. With one CPU, `length - 1` is 0, the launcher
     * starts no worker and waits for one to end.
     */
    maxInstances: Math.max(1, os.cpus().length - 1)
}
