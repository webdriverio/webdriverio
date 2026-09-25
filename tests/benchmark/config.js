/**
 * Benchmark config profile. Overrides come from the harness via Launcher args.
 * Defaults mirror a typical user run (info logging, mock driver, no outputDir).
 */
export const config = {
    capabilities: [{
        browserName: 'chrome'
    }],

    logLevel: 'info',
    framework: 'mocha',
    reporters: ['spec'],
    services: ['webdriver-mock'],
    waitforTimeout: 1000,
    connectionRetryTimeout: 5000,
    connectionRetryCount: 0,

    mochaOpts: {
        ui: 'bdd',
        timeout: 10000
    },

    jasmineOpts: {
        defaultTimeoutInterval: 1000 * 60 * 3
    },

    cucumberOpts: {
        timeout: 5000
    }
}
