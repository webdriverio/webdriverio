// cucumber-framework
const hook: WebdriverIO.HookFunctions = {
    beforeFeature: function (uri, feature, scenarios) {
    },
    beforeScenario: function (uri, feature, scenario, sourceLocation) {
    },
    beforeStep: function (uri, feature, stepData, context) {
    },
    afterStep(uri: string, feature, { error, result, duration, passed }, stepData, context) {
    },
    afterScenario: function (uri, feature, scenario, result, sourceLocation) {
    },
    afterFeature: function (uri, feature, scenarios) {
    },
}

export default {}
