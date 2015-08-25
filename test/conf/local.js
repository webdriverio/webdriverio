var local = {
    // host: 'localhost',
    // port: process.env._PORT || 4445,
    logLevel: 'silent',
    waitforTimeout: 1000,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,
    desiredCapabilities: {
        browserName: process.env._BROWSER || 'phantomjs'
    }
};

if(process.env._ENV === 'multibrowser') {
    module.exports = {
        capabilities: {
            browserA: local,
            browserB: local
        }
    };
    return;
}

module.exports = local;