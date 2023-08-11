import os from 'node:os'
import url from 'node:url'
import path from 'node:path'
import type { Capabilities, Options } from '@wdio/types'

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
        browserName: 'edge',
        'ms:edgeOptions': {
            args: ['--headless', '--disable-gpu']
        }
    }, {
        browserName: 'firefox',
        'moz:firefoxOptions': {
            args: ['-headless']
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
    (config.capabilities as Capabilities.Capabilities[]).push({
        browserName: 'safari'
    })
}
