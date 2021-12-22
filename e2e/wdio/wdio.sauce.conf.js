const path = require('path')
const { config } = require('./wdio.conf')

exports.config = {
    ...config,
    user: process.env.SAUCE_USERNAME,
    key: process.env.SAUCE_ACCESS_KEY,

    /**
     * Sauce specific config
     */
    specs: [path.resolve(__dirname, 'cloud', '*.e2e.js')],
    capabilities: [{
        browserName: 'Chrome',
        browserVersion: 'latest',
        platformName: 'Windows 10',
        'sauce:options': {
            name: 'WebdriverIO Connection Test'
        }
    }]
}
