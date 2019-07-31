// cucumber-framework
const hook: WebdriverIO.HookFunctions = {
    beforeFeature: function (uri, feature) {
    },
    beforeScenario: function (uri, feature, scenario) {
    },
    beforeStep: function (uri, feature, scenario, step, sourceLocation) {
    },
    afterStep(uri: string, feature, scenario, step, result) {
        [feature.x, scenario.x, step.x, result.duration]
    },
    afterScenario: function (uri, feature, scenario, result, sourceLocation) {
    },
    afterFeature: function (uri, feature) {
    },
}

export default {}
