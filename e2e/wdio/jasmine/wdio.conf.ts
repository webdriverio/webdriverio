import os from 'node:os'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config: WebdriverIO.Config = {
    /**
     * specify test files
     */
    specs: [
        path.join(__dirname, 'jasmine.e2e.ts')
    ],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        browserVersion: 'stable',
        'goog:chromeOptions': {
            args: [
                'headless',
                'disable-gpu',
                // See https://github.com/webdriverio/webdriverio/issues/14168.
                ...(os.platform() === 'linux' ? ['no-sandbox'] : [])
            ]
        }
    }],
    bail: 1,

    /**
     * test configurations
     */
    logLevel: 'info',
    framework: 'jasmine',
    outputDir: path.join(__dirname, '..'),

    reporters: ['spec'],

    jasmineOpts: {
        defaultTimeoutInterval: 60000
    }
}
