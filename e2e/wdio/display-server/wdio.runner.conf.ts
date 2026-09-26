import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

/**
 * Runs runner.e2e.ts through the local runner, which starts a display server in
 * `initialize()`, or only sets the session vars when a Wayland display exists.
 */
export const config: WebdriverIO.Config = {
    specs: [
        path.join(__dirname, 'runner.e2e.ts')
    ],

    /** No --headless, so the session needs the runner's display. */
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                '--no-sandbox',
                '--disable-dev-shm-usage'
            ],
            ...(process.env.CHROME_BIN && { binary: process.env.CHROME_BIN })
        },
        // Images that use the distro's Chromium set this to the distro's chromedriver, which matches that Chromium.
        ...(process.env.CHROMEDRIVER_PATH && {
            'wdio:chromedriverOptions': { binary: process.env.CHROMEDRIVER_PATH }
        })
    }],

    logLevel: 'info',
    framework: 'mocha',
    outputDir: path.join(__dirname, 'logs'),

    runner: 'local',

    // Let the local runner start Xvfb/Weston when the container has no display.
    displayServerEnabled: true,
    displayServer: (process.env.DISPLAY_SERVER_PREFERENCE || 'auto') as WebdriverIO.Config['displayServer'], // set per CI matrix cell

    reporters: ['spec'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 120000
    },
}
