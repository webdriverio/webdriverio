const { config } = require('./wdio.sauce.conf')

exports.config = Object.assign(config, {
    maxInstances: 1000,
    capabilities: [{
        browserName: 'chrome',
        platform: 'Windows 10',
        version: 64,
        build: 24
    }, {
        browserName: 'chrome',
        platform: 'Windows 10',
        version: 63,
        build: 24
    }, {
        browserName: 'chrome',
        platform: 'Windows 10',
        version: 62,
        build: 24
    }, {
        browserName: 'chrome',
        platform: 'Windows 10',
        version: 61,
        build: 24
    }, {
        browserName: 'chrome',
        platform: 'Windows 10',
        version: 60,
        build: 24
    }, {
        browserName: 'chrome',
        platform: 'Windows 10',
        version: 59,
        build: 24
    }, {
        browserName: 'chrome',
        platform: 'Windows 10',
        version: 58,
        build: 24
    }, {
        browserName: 'firefox',
        platform: 'Windows 10',
        version: 58,
        build: 24
    }, {
        browserName: 'firefox',
        platform: 'Windows 10',
        version: 57,
        build: 24
    }, {
        browserName: 'firefox',
        platform: 'Windows 10',
        version: 56,
        build: 24
    }, {
        browserName: 'firefox',
        platform: 'Windows 10',
        version: 55,
        build: 24
    }, {
        browserName: 'firefox',
        platform: 'Windows 10',
        version: 54,
        build: 24
    }, {
        browserName: 'firefox',
        platform: 'Windows 10',
        version: 53,
        build: 24
    }, {
        browserName: 'firefox',
        platform: 'Windows 10',
        version: 52,
        build: 24
    }]
})
