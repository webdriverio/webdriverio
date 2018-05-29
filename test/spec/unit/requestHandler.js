const WebdriverIO = require('../../../')

describe('requestHandler', () => {
    it('should properly parse hostname', async function () {
        // create a new session with ipv4
        let testDriver = WebdriverIO.remote({
            host: '127.0.0.1',
            desiredCapabilities: {
                browserName: 'phantomjs'
            }
        })

        // check the created request object
        testDriver.requestHandler.createOptions({
            path: ''
        }, {}).uri.should.include({
            hostname: '127.0.0.1',
            host: '127.0.0.1:4444'
        })

        // create a new session with ipv6
        testDriver = WebdriverIO.remote({
            host: '::1',
            desiredCapabilities: {
                browserName: 'phantomjs'
            }
        })

        // check the created request object
        testDriver.requestHandler.createOptions({
            path: ''
        }, {}).uri.should.include({
            hostname: '::1',
            host: '[::1]:4444'
        })

        // create a new session with ipv6
        testDriver = WebdriverIO.remote({
            host: 'localhost',
            desiredCapabilities: {
                browserName: 'phantomjs'
            }
        })

        // check the created request object
        testDriver.requestHandler.createOptions({
            path: ''
        }, {}).uri.should.include({
            hostname: 'localhost',
            host: 'localhost:4444'
        })
    })
})
