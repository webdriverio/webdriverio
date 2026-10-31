import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * Local only: Chrome on an Android emulator with Appium UiAutomator2. Needs the
 * Android SDK with an emulator (AVD) that has Chrome, and a global Appium with
 * the UiAutomator2 driver (see CONTRIBUTING.md). Run with `pnpm run test:android:local`.
 */
export const config: WebdriverIO.Config = {
    specs: [path.join(__dirname, 'mobileWeb.e2e.ts')],

    capabilities: [{
        platformName: 'Android',
        browserName: 'Chrome',
        'appium:automationName': 'UiAutomator2',
        /**
         * Appium starts this emulator when no device is connected
         */
        ...(process.env.ANDROID_AVD ? { 'appium:avd': process.env.ANDROID_AVD } : {}),
        ...(process.env.ANDROID_UDID ? { 'appium:udid': process.env.ANDROID_UDID } : {}),
        'appium:avdLaunchTimeout': 300_000
    }],
    connectionRetryTimeout: 600_000,
    connectionRetryCount: 0,

    services: [['appium', {
        command: process.env.APPIUM_COMMAND || 'appium',
        /**
         * download a Chromedriver for the Chrome version of the emulator
         */
        args: { allowInsecure: 'uiautomator2:chromedriver_autodownload' }
    }]],

    logLevel: 'info',
    framework: 'mocha',
    outputDir: path.join(__dirname, 'logs', 'android'),

    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 120_000
    }
}
