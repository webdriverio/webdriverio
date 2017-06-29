import detectSeleniumBackend from '../../../lib/helpers/detectSeleniumBackend'

describe('WebdriverIO detects Selenium backend', () => {
    it('should not set anything if host is set in caps', () => {
        const caps = {
            host: '0.0.0.0',
            port: 1234
        }
        detectSeleniumBackend(caps).should.be.deep.equal(caps)
    })

    it('should default to local selenium server', () => {
        const caps = detectSeleniumBackend({})
        caps.host.should.be.deep.equal('127.0.0.1')
        caps.port.should.be.deep.equal(4444)
    })

    it('should default if host or port is not given', () => {
        let caps = detectSeleniumBackend({ port: 1234 })
        caps.host.should.be.deep.equal('127.0.0.1')
        caps.port.should.be.deep.equal(1234)

        caps = detectSeleniumBackend({ host: 'foobar' })
        caps.host.should.be.deep.equal('foobar')
        caps.port.should.be.deep.equal(4444)
    })

    it('should detect browserstack user', () => {
        const caps = detectSeleniumBackend({
            user: 'foobar',
            key: 'zHcv9sZ39ip8ZPsxBVJ2'
        })
        caps.host.should.be.deep.equal('hub.browserstack.com')
        caps.port.should.be.deep.equal(80)
    })

    it('should detect testingbot user', () => {
        const caps = detectSeleniumBackend({
            user: 'foobar',
            key: 'ec337d7b677720a4dde7bd72be0bfc67'
        })
        caps.host.should.be.deep.equal('hub.testingbot.com')
        caps.port.should.be.deep.equal(80)
    })

    it('should detect saucelabs user', () => {
        const caps = detectSeleniumBackend({
            user: 'foobar',
            key: '50aa152c-1932-B2f0-9707-18z46q2n1mb0'
        })
        caps.host.should.be.deep.equal('ondemand.saucelabs.com')
        caps.port.should.be.deep.equal(443)
        caps.protocol.should.be.deep.equal('https')
    })
})
