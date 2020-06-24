// cucumber-framework
const hook: WebdriverIO.HookFunctions = {
    beforeFeature: function (uri, feature, scenarios) {
    },
    beforeScenario: function (uri, feature, scenario, sourceLocation, context) {
        // test if line is properly referenced to `SourceLocation.line`
        sourceLocation.line = 123
    },
    beforeStep: function ({ uri, feature, step }, context) {
    },
    afterStep({ uri: string, feature, step }, context, { error, result, duration, passed }) {
    },
    afterScenario: function (uri, feature, scenario, result, sourceLocation, context) {
    },
    afterFeature: function (uri, feature, scenarios) {
        expect(browser).toHaveTitle('some title')

        const el = $('selector')
        expect(el).toHaveTextContaining('foobar')
    }
}

const config: WebdriverIO.Config = {
    cucumberOpts: {
        timeout: 123,
        require: ['123']
    }
}
