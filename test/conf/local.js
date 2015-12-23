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

if (process.env._ENV === 'multibrowser') {
    let multibrowserConfig = {
        capabilities: {
            browserA: config,
            browserB: config
        }
    }
    config = multibrowserConfig
}

export default config
