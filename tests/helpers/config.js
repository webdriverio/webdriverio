exports.config = {
    /**
     * server configurations
     */
    hostname: 'localhost',
    port: 4444,
    path: '/',

    /**
     * capabilities
     */
    capabilities: [{
        browserName: 'chrome'
    }],

    /**
     * test configurations
     */
    logLevel: 'trace',
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec'],
    services: ['webdriver-mock'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 10000,
        require: ['@babel/register'],
        grep: 'SKIPPED_GREP',
        invert: true
    },

    jasmineNodeOpts: {
        defaultTimeoutInterval: 1000 * 60 * 3,
        grep: 'SKIPPED_GREP',
        invertGrep: true
    },

    cucumberOpts: {
        timeout: 5000,
        requireModule: ['@babel/register'],
        require: ['./tests/cucumber/step-definitions/*.js']
    },

    async beforeFeature () {
        await browser.pause(30)
        browser.Cucumber_Test = 0
    },
    beforeScenario: () => {
        browser.pause(30)
        browser.Cucumber_Test = 1
    },
    beforeStep: async function (uri, feature, stepData, context) {
        await browser.pause(20)
        browser.Cucumber_Test += 2
        browser.Cucumber_CurrentStepText = stepData.step.text
        browser.Cucumber_CurrentStepContext = context
    },
    afterStep: function (uri, feature, result, stepData, context) {
        browser.pause(25)
        if (browser.Cucumber_CurrentStepText !== stepData.step.text ||
            browser.Cucumber_CurrentStepContext !== context) {
            throw new Error("step data doesn't match")
        }
        browser.Cucumber_Test = 1
    },
    afterScenario: () => {
        browser.pause(30)
        browser.Cucumber_Test = -1
    },
    afterFeature: () => {
        delete browser.Cucumber_Test
        browser.pause(30)
    },
}
