// including per-browser options
interface myCapabilities extends WebdriverIO.Capabilities {
}
interface myConfig extends WebdriverIO.Config {
    capabilities: myCapabilities[]
}

const config: myConfig = {
    capabilities: [
        {
            browserName: 'chrome',
            maxInstances: 3 // <-- assert that we can re-use the `maxInstances` property from WdioOptions
        },
        {
            browserName: 'firefox',
            maxInstances: 2
        }
    ]
}