import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * Local only: iOS Safari on a Simulator with Appium XCUITest. Needs macOS,
 * Xcode with an iOS runtime, and a global Appium with the XCUITest driver
 * (see CONTRIBUTING.md). Run with `pnpm run test:ios:local`.
 */
export const config: WebdriverIO.Config = {
    specs: [path.join(__dirname, 'mobileWeb.e2e.ts')],

    capabilities: [{
        platformName: 'iOS',
        browserName: 'Safari',
        'appium:automationName': 'XCUITest',
        'appium:deviceName': process.env.IOS_DEVICE_NAME || 'iPhone 17',
        ...(process.env.IOS_PLATFORM_VERSION ? { 'appium:platformVersion': process.env.IOS_PLATFORM_VERSION } : {}),
        ...(process.env.IOS_UDID ? { 'appium:udid': process.env.IOS_UDID } : {}),
        ...(process.env.PREBUILT_WDA_PATH ? { 'appium:prebuiltWDAPath': process.env.PREBUILT_WDA_PATH, 'appium:usePreinstalledWDA': true } : {}),
        /**
         * the first session builds WebDriverAgent
         */
        'appium:wdaLaunchTimeout': 300_000
    }],
    connectionRetryTimeout: 600_000,
    connectionRetryCount: 0,

    services: [['appium', { command: process.env.APPIUM_COMMAND || 'appium' }]],

    logLevel: 'info',
    framework: 'mocha',
    outputDir: path.join(__dirname, 'logs', 'ios'),

    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 120_000
    }
}
