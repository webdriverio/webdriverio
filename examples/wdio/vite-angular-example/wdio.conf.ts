export const config: WebdriverIO.Config = {
    runner: 'browser',
    framework: 'mocha',
    mochaOpts: { ui: 'bdd' },
    logLevel: 'warn',
    specs: ['./src/**/*.test.ts'],
    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': { args: ['--headless=new'] }
    }]
}
