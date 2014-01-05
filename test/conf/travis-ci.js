module.exports = {
    testPage: {
        start: 'http://127.0.0.1:8080/test/site/www/index.html',
        subPage: 'http://127.0.0.1:8080/test/site/www/two.html'
    },
    host: 'ondemand.saucelabs.com',
    port: 80,
    logLevel: 'silent',
    desiredCapabilities : {
        browserName: process.env._BROWSER.replace(/_/g,' '),
        platform: process.env._PLATFORM.replace(/_/g,' '),
        version: process.env._VERSION,
        'tunnel-identifier': process.env.TRAVIS_JOB_NUMBER,
        tags: ['webdriverjs','api','test'],
        name: 'webdriverjs API test',
        build: process.env.TRAVIS_BUILD_NUMBER,
        username: process.env.SAUCE_USERNAME,
        accessKey: process.env.SAUCE_ACCESS_KEY
    }
};