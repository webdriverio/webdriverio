var local = {
    host: 'localhost',
    port: process.env._PORT || 4444,
    logLevel: 'silent',
    waitforTimeout: 1000,
    desiredCapabilities: {
        browserName: process.env._BROWSER || 'phantomjs'
    }
};

if(process.env._ENV === 'multibrowser') {
    return module.exports = {
        capabilities: {
            browserA: local,
            browserB: local
        }
    };
}

module.exports = local