import os from 'node:os'
import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

const isLinux = os.platform() === 'linux'
const isApple = os.platform() === 'darwin'
const isWindows = os.platform() === 'win32'

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
    capabilities: [
        {
            browserName: 'chrome',
            webSocketUrl: true,
            'goog:chromeOptions': {
                args: ['headless', 'disable-gpu']
            }
        },
        {
            browserName: 'firefox',
            webSocketUrl: true,
            'moz:firefoxOptions': {
                args: ['-headless']
            }
        },
        {
            browserName: 'edge',
            webSocketUrl: true,
            'ms:edgeOptions': {
                args: [
                    'headless',
                    'disable-gpu',
                    // Having `WebDriverError: session not created: Chrome instance exited` since ubuntu 22.04 to 24.04, since the below is no more wrapped by default.
                    // See https://github.com/webdriverio/webdriverio/issues/14168.
                    ...(isLinux ? ['no-sandbox'] : [])
                ]
            },
        },
        // Excluding Chromium on Windows due to `Error: chromium is not available on Windows.`
        ...(!isWindows ? [{
            browserName: 'chromium',
            webSocketUrl: true,
            'goog:chromeOptions': {
                args: [
                    'headless',
                    'disable-gpu',
                    // Having `WebDriverError: session not created: Chrome instance exited` since ubuntu 22.04 to 24.04, since the below is no more wrapped by default.
                    // See https://github.com/webdriverio/webdriverio/issues/14168.
                    ...(isLinux ? ['no-sandbox'] : [])
                ]
            }
        }] : []),
        ...(isApple ? [{
            // Not yet supported, safari use classic WebDriver for now.
            // webSocketUrl: true,
            browserName: 'safari'
        }] : [])
    ],

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
