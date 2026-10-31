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
        },
        {
            browserName: 'firefox',
            'wdio:specs': [['a.spec.ts', 'b.spec.ts'], 'c.spec.ts'],
        }
    ]
}

// the options of each browser driver, from the driver packages
const driverOptions: WebdriverIO.Capabilities[] = [
    { browserName: 'chrome', 'wdio:chromedriverOptions': { logPath: 'chromedriver.log', verbose: true, binary: '/path/to/chromedriver' } },
    { browserName: 'firefox', 'wdio:geckodriverOptions': { profileRoot: 'D:\\a\\_temp', log: 'trace', geckoDriverVersion: '0.36.0' } },
    { browserName: 'msedge', 'wdio:edgedriverOptions': { logPath: 'msedgedriver.log', verbose: true } },
    { browserName: 'safari', 'wdio:safaridriverOptions': { useTechnologyPreview: true, diagnose: true } }
]
