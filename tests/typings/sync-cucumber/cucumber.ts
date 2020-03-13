// cucumber-framework
const hook: WebdriverIO.HookFunctions = {
    beforeFeature: function (uri, feature, scenarios) {
    },
    beforeScenario: function (uri, feature, scenario, sourceLocation) {
    },
    beforeStep: function ({ uri, feature, step }, context) {
    },
    afterStep({ uri: string, feature, step }, context, { error, result, duration, passed }) {
    },
    afterScenario: function (uri, feature, scenario, result, sourceLocation) {
    },
    afterFeature: function (uri, feature, scenarios) {
    }
}

export default {}
