// including per-browser/-capability options
interface myCapabilities extends WebdriverIO.Capabilities {
}
interface myConfig extends WebdriverIO.Config {
    capabilities: myCapabilities[]
}

const config: myConfig = {
    capabilities: [
        {
            browserName: 'chrome',
            maxInstances: 3 ,// <-- assert, but deprecated
            'wdio:maxInstances': 3, // <-- assert
            specs: ['foo'], // <-- assert, but deprecated
            'wdio:specs': ['foo'], // <-- assert
            exclude: ['bar'], // <-- assert, but deprecated
            'wdio:exclude': ['bar'] // <-- assert
        }
    ]
}