const path = require('path')

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

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
    coloredLogs: true,
    framework: 'mocha',
    outputDir: __dirname,

    reporters: ['spec'],
    services: ['webdriver-mock'],

    mochaOpts: {
        ui: 'bdd',
        timeout: 10000,
        require: ['@babel/register']
    },

    jasmineNodeOpts: {
        defaultTimeoutInterval: 1000 * 60 * 3
    },

    cucumberOpts: {
        timeout: 5000,
        requireModule: ['@babel/register'],
        require: [path.join(__dirname, '..', 'cucumber', 'step-definitions', '*.js')]
    },

    async beforeFeature () {
        await browser.pause(30)
        browser.Cucumber_Test = 0
    },
    beforeScenario: () => {
        browser.pause(30)
        browser.Cucumber_Test = 1
    },
    beforeStep: async function () {
        await browser.pause(20)
        browser.Cucumber_Test += 2
    },
    afterStep: function () {
        browser.pause(25)
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

    before() {
        global.WDIO_SERVICE_TEST_IT_DURATION = 0
        global.WDIO_SERVICE_TEST_IT_PASSES = 0

        global.WDIO_SERVICE_TEST_HOOK_DURATION = 0
        global.WDIO_SERVICE_TEST_HOOK_PASSES = 0
    },
    beforeTest(test) {
        if (global.WDIO_SERVICE_TEST_IT_DURATION === 0) {
            throw new Error('wdio beforeTest error: ' + test.title)
        }
    },
    afterTest(test, context, { error, duration, passed }) {
        let throwError = false
        if (global.WDIO_SERVICE_TEST_IT_DURATION === 0) {
            throwError = true
        }

        global.WDIO_SERVICE_TEST_IT_DURATION += duration
        if (!error && passed === true && browser.pause(2) === undefined) {
            global.WDIO_SERVICE_TEST_IT_PASSES++
        }

        if (throwError) {
            throw new Error('wdio afterTest error: ' + test.title)
        }
    },
    beforeHook(test) {
        if (global.WDIO_SERVICE_TEST_HOOK_DURATION === 0) {
            throw new Error('wdio beforeHook error: ' + test.title)
        }
    },
    async afterHook(test, context, { error, duration, passed }) {
        await sleep(20)
        let throwError = false
        if (global.WDIO_SERVICE_TEST_HOOK_DURATION === 0) {
            throwError = true
        }

        global.WDIO_SERVICE_TEST_HOOK_DURATION += duration
        if (!error && passed === true) {
            global.WDIO_SERVICE_TEST_HOOK_PASSES++
        }

        if (throwError) {
            throw new Error('wdio afterTest error: ' + test.title)
        }
    },
}
