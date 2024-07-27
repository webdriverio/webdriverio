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
            'wdio:maxInstances': 3,
            'wdio:specs': ['foo'],
            'wdio:exclude': ['bar']
        }
    ]
}
