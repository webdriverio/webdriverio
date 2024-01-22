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
    specs: [[
        path.join(__dirname, 'headless', 'secondTest.e2e.ts'),
        path.join(__dirname, 'headless', 'bidi.e2e.ts')
    ]],

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome',
        webSocketUrl: true,
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
    }, {
        browserName: 'chrome',
        browserVersion: 'canary',
        webSocketUrl: true,
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
    }, {
        browserName: 'firefox',
        webSocketUrl: true,
        'moz:firefoxOptions': {
            args: ['-headless']
        }
    }, {
        browserName: 'edge',
        webSocketUrl: true,
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
        // not yet supported
        // webSocketUrl: true,
        browserName: 'safari'
    })
}

if (os.platform() !== 'win32') {
    (config.capabilities as WebdriverIO.Capabilities[]).push({
        browserName: 'chromium',
        webSocketUrl: true,
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu']
        }
    })
}

/**
 * latest Firefox 124.0a1 is not available on Linux
 */
if (os.platform() === 'win32' || os.platform() === 'darwin') {
    (config.capabilities as WebdriverIO.Capabilities[]).push({
        browserName: 'firefox',
        webSocketUrl: true,
        browserVersion: 'latest',
        'moz:firefoxOptions': {
            args: ['-headless']
        }
    })
}
