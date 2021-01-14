const config: WebdriverIO.Config = {
    cucumberOpts: {
        timeout: 123,
        require: ['123'],
        // @ts-expect-error
        scenarioLevelReporter: 'wrong param'
    },
    capabilities: {}
}

const configB: WebdriverIO.Config = {
    capabilities: {},
    beforeFeature (uri, feature) {
        uri.lastIndexOf('foo')
        feature.children[0].scenario.name.lastIndexOf('bar')
    }
}
