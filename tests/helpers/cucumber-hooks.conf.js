const { config } = require('./config')

exports.config = Object.assign({}, config, {
    framework: 'cucumber',

    async beforeFeature () {
        await browser.pause(30)
        browser.Cucumber_Test = 0
    },
    beforeScenario: () => {
        browser.pause(30)
        browser.Cucumber_Test = 1
    },
    beforeStep: async function ({ step }, world) {
        await browser.pause(20)
        browser.Cucumber_Test += 2
        browser.Cucumber_CurrentStepText = step.step.text
        browser.Cucumber_CurrentWorld = world
    },
    afterStep: function ({ step }, world) {
        browser.pause(25)
        if (
            browser.Cucumber_CurrentStepText !== step.step.text ||
            browser.Cucumber_CurrentWorld !== world
        ) {
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
})
