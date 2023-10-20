import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import type { Options } from '@wdio/types'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * with this config file we verify that the `webdriverio` package can spin
 * up the necessary browser runner without needing a service anymore.
 */
export const config: Options.Testrunner = {
    /**
     * specify test files
     */
    specs: [path.join(__dirname, 'headless', 'secondTest.e2e.ts')],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
    }, {
        browserName: 'chrome',
        browserVersion: 'canary',
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
    }, {
        browserName: 'firefox',
        'moz:firefoxOptions': {
            args: ['-headless']
        }
    }, {
        browserName: 'firefox',
        browserVersion: 'latest',
        'moz:firefoxOptions': {
            args: ['-headless']
        }
    }, {
        browserName: 'edge',
        'ms:edgeOptions': {
            args: ['headless', 'disable-gpu']
        }
    }],

    /**
     * test configurations
     */
    logLevel: 'info',
    framework: 'mocha',
    outputDir: __dirname,
    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}

if (os.platform() === 'darwin') {
    (config.capabilities as WebdriverIO.Capabilities[]).push({
        browserName: 'safari'
    })
}

if (os.platform() !== 'win32') {
    (config.capabilities as WebdriverIO.Capabilities[]).push({
        browserName: 'chromium',
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
    })
}
