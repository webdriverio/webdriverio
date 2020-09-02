const config: WebdriverIO.Config = {
    cucumberOpts: {
        timeout: 123,
        require: ['123']
    },
    beforeScenario: function(uri, feature, pickle, sourceLocation, world) {
        console.log(uri, feature, pickle, sourceLocation, world)
    },
    afterScenario: function(uri, feature, pickle, result, sourceLocation, world) {
        console.log(uri, feature, pickle, result, sourceLocation, world)
    }
}
