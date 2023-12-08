import { config as baseConfig } from './config.js'

export const config = Object.assign({}, baseConfig, {
    framework: 'cucumber',

    async beforeFeature () {
        await browser.pause(30)
        browser.Cucumber_Test = 0
    },
    beforeScenario: async () => {
        await browser.pause(30)
        browser.Cucumber_Test = 1
    },
    beforeStep: async function (step, scenario) {
        await browser.pause(20)
        browser.Cucumber_Test += 2
        browser.Cucumber_CurrentStepText = step.text
        browser.Cucumber_CurrentScenario = scenario.name
    },
    afterStep: async function (step, scenario, result) {
        await browser.pause(25)
        if (
            browser.Cucumber_CurrentStepText !== step.text ||
            browser.Cucumber_CurrentScenario !== scenario.name ||
            typeof result.passed !== 'boolean'
        ) {
            throw new Error("step data doesn't match")
        }
        browser.Cucumber_Test = 1
    },
    afterScenario: async () => {
        await browser.pause(30)
        browser.Cucumber_Test = -1
    },
    afterFeature: async () => {
        delete browser.Cucumber_Test
        await browser.pause(30)
    },
    beforeHook: async () => {
        browser.Cucumber_BeforeHook = (browser.Cucumber_BeforeHook || 0) + 1
    },
    afterHook: async () => {
        browser.Cucumber_AfterHook = (browser.Cucumber_AfterHook || 0) + 1
    },
    after: () => {
        /**
         * expect hooks to be exected 46 times
         */
        if (browser.Cucumber_AfterHook !== browser.Cucumber_BeforeHook || browser.Cucumber_AfterHook === 0) {
            /**
             * if assertion fails:
             * - print error stack so we know where it failed
             * - exit process with failure to let smoke test fail
             */
            console.log(new Error('AssertionError: Cucumber did not execute beforeHook/afterHook hooks correctly'))
            process.exit(1)
        }
    }
})
