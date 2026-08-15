import url from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

export const config: WebdriverIO.Config = {
    /**
     * specify test files
     */
    specs: [
        path.join(__dirname, '*.e2e.ts')
    ],

    /**
     * capabilities - run headless since we're testing xvfb functionality
     */
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: [
                '--headless=new',
                '--no-sandbox',
                '--disable-dev-shm-usage'
            ],
            // Handle Alpine Linux with chromium-browser
            ...(process.env.CHROME_BIN && { binary: process.env.CHROME_BIN })
        },
        // Chrome-for-Testing chromedriver is glibc-only, so Alpine (musl) and
        // any other distro without a glibc loader must provide a system
        // chromedriver and point us at it. Set CHROMEDRIVER_PATH to opt in.
        ...(process.env.CHROMEDRIVER_PATH && {
            'wdio:chromedriverOptions': { binary: process.env.CHROMEDRIVER_PATH }
        })
    }],

    /**
     * test configurations
     */
    logLevel: 'info',
    framework: 'mocha',
    outputDir: path.join(__dirname, 'logs'),

    /**
     * Use local runner to test xvfb integration
     */
    runner: 'local',

    /**
     * Disable automatic display-server initialization so tests can control it manually
     */
    displayServerEnabled: false,
    /**
     * Do not auto-install the display server by default; tests will enable it when needed
     */
    displayServerAutoInstall: false,

    /**
     * Reporters
     */
    reporters: ['spec'],

    /**
     * Mocha options
     */
    mochaOpts: {
        ui: 'bdd',
        timeout: 300000, // 5 minutes to allow for package installation
        require: []
    },
}
