const config: WebdriverIO.Config = {
    cucumberOpts: {
        timeout: 123,
        require: ['123'],
        // @ts-expect-error
        scenarioLevelReporter: 'wrong param'
    },
    capabilities: {}
}
