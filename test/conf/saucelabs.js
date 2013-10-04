module.exports = {
    host: 'ondemand.saucelabs.com',
    port: 80,
    desiredCapabilities : {
        platform: 'XP',
        tags: ['webdriverjs','api','test'],
        name: 'webdriverjs API test',
        build: process.env.TRAVIS_BUILD_NUMBER ? 'build' + process.env.TRAVIS_BUILD_NUMBER : Date.now(),
        username: process.env.SAUCE_USERNAME,
        accessKey: process.env.SAUCE_ACCESS_KEY,
        'record-video': false,
        'record-screenshots': false
    }
}