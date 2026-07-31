/**
 * WebdriverIO config file for testing the --headless CLI flag.
 *
 * The capabilities here set headless ON by default (useful for CI).
 * Run `pnpm test:headed` (--headless=false) to strip the headless args at runtime.
 * Run `pnpm test:headless` (--headless) to force headless even if you remove the args.
 */
export const config = {
    runner: 'local',
    specs: ['./tests/*.test.js'],
    capabilities: [{
        browserName: 'chrome',
        // Headless is set here by default — the --headless=false CLI flag will strip it
        'goog:chromeOptions': {
            args: ['--no-sandbox', '--disable-dev-shm-usage', '--headless', '--disable-gpu']
        }
    }],
    maxInstances: 1,
    logLevel: 'warn',
    framework: 'mocha',
    reporters: ['spec'],
    mochaOpts: {
        timeout: 60000
    }
}
