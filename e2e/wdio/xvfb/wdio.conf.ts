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
        browserVersion: 'stable',
        'goog:chromeOptions': {
            args: [
                '--headless=new',
                '--disable-gpu',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-extensions',
                '--disable-background-timer-throttling',
                '--disable-backgrounding-occluded-windows',
                '--disable-renderer-backgrounding'
            ],
            // Handle Alpine Linux with chromium-browser
            ...(process.env.CHROME_BIN && { binary: process.env.CHROME_BIN })
        }
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
     * Disable automatic xvfb initialization so tests can control it manually
     */
    disableAutoXvfb: true,

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

    /**
     * Hooks
     */
}
