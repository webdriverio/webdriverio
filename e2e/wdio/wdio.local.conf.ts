import os from 'node:os'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * with this config file we verify that the `webdriverio` package can spin
 * up the necessary browser runner without needing a service anymore.
 */
export const config: WebdriverIO.Config = {
    /**
     * specify test files
     */
    specs: [[
        path.join(__dirname, 'headless', 'launch.e2e.ts'),
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
    // }, {
    //     browserName: 'chrome',
    //     browserVersion: 'canary',
    //     webSocketUrl: true,
    //     'goog:chromeOptions': {
    //         args: ['headless', 'disable-gpu']
    //     }
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
    specFileRetries: 3,

    mochaOpts: {
        ui: 'bdd',
        timeout: 60000
    }
}

if (os.platform() === 'darwin') {
    config.capabilities.push({
        // not yet supported
        // webSocketUrl: true,
        browserName: 'safari'
    })
}

/**
 * Disable these tests as they started failing, due to:
 *   > WebDriver Bidi command "browsingContext.navigate" failed with error:
 *     unknown error - net::ERR_BLOCKED_BY_CLIENT
 */
// if (os.platform() !== 'win32') {
//     config.capabilities.push({
//         browserName: 'chromium',
//         webSocketUrl: true,
//         'goog:chromeOptions': {
//             args: ['headless', 'disable-gpu']
//         }
//     })
// }

/**
 * latest Firefox 124.0a1 is not available on Linux
 * Disable FF nightly tests due to WebDriver Bidi command "browsingContext.navigate" failed with error: unknown error
 * @see https://bugzilla.mozilla.org/show_bug.cgi?id=1908515
 */
// if (os.platform() === 'win32' || os.platform() === 'darwin') {
//     config.capabilities.push({
//         browserName: 'firefox',
//         webSocketUrl: true,
//         browserVersion: 'latest',
//         'moz:firefoxOptions': {
//             args: ['-headless']
//         }
//     })
// }
