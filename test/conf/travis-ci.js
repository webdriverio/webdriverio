module.exports = {
    testPage: {
        start: 'http://127.0.0.1:8080/test/site/www/index.html',
        subPage: 'http://127.0.0.1:8080/test/site/www/two.html',
        gestureTest: 'http://127.0.0.1:8080/test/site/www/gestureTest.html'
    },
    port: 4445,
    logLevel: 'command',
    waitforTimeout: 1000,
    desiredCapabilities: {
        browserName: (process.env._BROWSER || '').replace(/_/g, ' '),
        platform: (process.env._PLATFORM || '').replace(/_/g, ' '),
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