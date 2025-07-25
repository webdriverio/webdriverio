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
            ]
        }
    }],

    /**
     * test configurations
     */
    logLevel: 'info',
    framework: 'mocha',
    outputDir: __dirname,

    /**
     * Use local runner to test xvfb integration
     */
    runner: 'local',

    /**
     * Reporters
     */
    reporters: ['spec'],

    /**
     * Mocha options
     */
    mochaOpts: {
        ui: 'bdd',
        timeout: 60000,
        require: []
    },

    /**
     * Hooks
     */
    before: async () => {
        // Ensure we're in the right environment
        console.log('Platform:', process.platform)
        console.log('CI:', process.env.CI)
        console.log('Node version:', process.version)
    },

    beforeTest: async () => {
        // Log test environment
        console.log('Starting xvfb E2E test...')
    },

    afterTest: async () => {
        // Cleanup after each test
        console.log('Xvfb E2E test completed')
    }
}