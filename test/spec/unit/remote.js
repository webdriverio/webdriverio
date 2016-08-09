import { remote } from '../../../index.js'
import RequestHandler from '../../../lib/utils/RequestHandler'
import q from 'q'

const sessionID = 'ba8ca350-e0e3-4a73-aab5-1679559cdcd2'
const startPath = '/abc/xyz'

describe('remote method', () => {
    it('does not fail without options', () => {
        expect(() => {
            remote()
        }).not.to.throw
    })

    it('attaches client to existing session', () => {
        var client = remote(sessionID)
        client.requestHandler.sessionID.should.be.equal(sessionID)
    })

    it('should be able to set startPath', () => {
        var client = remote({ path: startPath })
        client.requestHandler.startPath.should.be.equal(startPath)
    })

    it('should not force firefox if browserName cap is an empty string', () => {
        var client = remote({ desiredCapabilities: { browserName: '', app: 'xyz' } })
        client.desiredCapabilities.browserName.should.be.equal('')
    })

    it('should default to firefox if caps are empty', () => {
        var client = remote({ desiredCapabilities: { } })
        client.desiredCapabilities.browserName.should.be.equal('firefox')
    })

    // This allows testing a native Android app via appium using an
    // already-installed app rather than uploading and installing from an apk.
    it('should not force firefox when app is undefined but appPackage is not', () => {
        var client = remote({ desiredCapabilities: { browserName: '', appPackage: 'com.example' } })
        client.desiredCapabilities.browserName.should.be.equal('')
    })

    describe('on reject', () => {
        const sandbox = sinon.sandbox.create()

        beforeEach(() => {
            sandbox.stub(RequestHandler.prototype, 'create')
                .returns(q.reject(new Error('o.O')))
        })

        afterEach(() => {
            sandbox.restore()
        })

        it('should fail if request failed', () => {
            var client = remote({})
            RequestHandler.prototype.create.returns(q.reject(new Error('some-error')))

            return assert.isRejected(client.getUrl(), /some-error/)
        })

        it('should not attach screenshot to error by default', () => {
            var client = remote({})

            return client.getUrl()
                .catch(err => assert.notProperty(err, 'screenshot'))
        })

        it('`catch` handler should intercept error', () => {
            var client = remote({screenshotOnReject: true})

            return client.getUrl()
                .catch(() => {})
                .catch(() => assert(false, 'should not call second handler'))
        })

        it('second argument of `then` should intercept error', () => {
            var client = remote({screenshotOnReject: true})

            return client.getUrl()
                .then(() => {}, () => {})
                .catch(() => assert(false, 'should not call second handler'))
        })

        it('should attach screenshot to error if screenshotOnReject option set', () => {
            var client = remote({screenshotOnReject: true})

            RequestHandler.prototype.create.withArgs('/session/:sessionId/screenshot')
                .returns(q.resolve({value: 'base64img='}))

            return client.getUrl()
                .catch(err => assert.propertyVal(err, 'screenshot', 'base64img='))
        })

        it('should attach screenshot on assert inside `then`', () => {
            var client = remote({screenshotOnReject: true})

            RequestHandler.prototype.create.withArgs('/session/:sessionId/screenshot')
                .returns(q.resolve({value: 'base64img='}))

            return client
                .then(() => {
                    throw new Error('o.O')
                })
                .catch(err => assert.propertyVal(err, 'screenshot', 'base64img='))
        })

        it('error stacktrace should not contain screenshot call', () => {
            var client = remote({screenshotOnReject: true})

            RequestHandler.prototype.create.withArgs('/session/:sessionId/screenshot')
                .returns(q.resolve({value: 'base64img='}))

            return client.getUrl()
                .catch(err => {
                    assert.notInclude(err.stack, 'screenshot')
                    assert.include(err.stack, 'getUrl')
                })
        })

        it('should try to take screenshot only once ', () => {
            var client = remote({screenshotOnReject: true})

            var takeScreenshot = RequestHandler.prototype.create.withArgs('/session/:sessionId/screenshot')
            takeScreenshot.returns(q.reject(new Error('some-error')))

            return client.getUrl()
                .catch(err => assert.calledOnce(takeScreenshot)) // eslint-disable-line handle-callback-err
        })

        it('should try to take screenshot only once on assert inside `then`', () => {
            var client = remote({screenshotOnReject: true})

            var takeScreenshot = RequestHandler.prototype.create.withArgs('/session/:sessionId/screenshot')
            takeScreenshot.throws(new Error())

            return client
                .init()
                .then(() => q.reject(new Error()))
                .catch(err => assert.calledOnce(takeScreenshot)) // eslint-disable-line handle-callback-err
        })

        it('should not try to take screenshot if screenshot command failed', () => {
            var client = remote({screenshotOnReject: true})

            var takeScreenshot = RequestHandler.prototype.create.withArgs('/session/:sessionId/screenshot')

            return q(client.screenshot())
                .catch(err => assert.calledOnce(takeScreenshot)) // eslint-disable-line handle-callback-err
        })

        it('should reject with original error if screenshot capture failed', () => {
            var client = remote({})
            RequestHandler.prototype.create
                .returns(q.reject(new Error('some-error')))
            RequestHandler.prototype.create.withArgs('/session/:sessionId/screenshot')
                .returns(q.reject(new Error('other-error')))

            return assert.isRejected(client.getUrl(), /some-error/)
        })
    })
})
