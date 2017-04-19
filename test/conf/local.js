let config = {
    host: 'localhost',
    port: process.env._PORT || 4444,
    path: process.env._PATH,
    logLevel: 'silent',
    waitforTimeout: 1000,
    desiredCapabilities: {
        browserName: process.env._BROWSER || 'phantomjs'
    }
}

const BUILD_ENV = process.env._ENV || (process.env.npm_lifecycle_event || '').split(':').pop()
if (BUILD_ENV === 'multibrowser') {
    let multibrowserConfig = {
        capabilities: {
            browserA: Object.assign({}, config),
            browserB: Object.assign({}, config)
        }
    }
    config = multibrowserConfig

    config.capabilities.browserA.baseUrl = 'http://google.com'
    config.capabilities.browserB.baseUrl = 'http://yahoo.com'
}

export default config
