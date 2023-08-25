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
        browser.Cucumber_Test_Step = 0
    },
    beforeStep: async function (step, scenario) {
        await browser.pause(20)
        browser.Cucumber_Test_Step += 1
        browser.Cucumber_CurrentStepText = step
        browser.Cucumber_CurrentScenario = scenario
    },
    afterStep: async function (step, scenario, result) {
        await browser.pause(25)
        if (
            browser.Cucumber_CurrentStepText !== step ||
            browser.Cucumber_CurrentScenario !== scenario ||
            typeof result.passed !== 'boolean'
        ) {
            throw new Error("step data doesn't match")
        }
    },
    afterScenario: async () => {
        await browser.pause(30)
        browser.Cucumber_Test = -1
    },
    afterFeature: async () => {
        delete browser.Cucumber_Test
        await browser.pause(30)
    },
})
