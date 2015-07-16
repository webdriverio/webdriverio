module.exports = {
    host: 'localhost',
    port: process.env._PORT || 4444,
    logLevel: 'command',
    waitforTimeout: 1000,
    runsWithSauce: true,
    desiredCapabilities: {
        browserName: (process.env._BROWSER || 'phantomjs').replace(/_/g, ' '),
        version: process.env._VERSION,
        'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
        'idle-timeout': 900,
        tags: ['webdriverio', process.env._ENV || 'desktop', process.env._BROWSER, process.env._PLATFORM, process.env._VERSION],
        name: 'webdriverio test',
        build: process.env.TRAVIS_BUILD_NUMBER,
        username: process.env.SAUCE_USERNAME,
        accessKey: process.env.SAUCE_ACCESS_KEY
    }
};