import { remote } from '../../../index.js'
import RequestHandler from '../../../lib/utils/RequestHandler'
import q from 'q'

describe('configureHttp command', () => {
    const sandbox = sinon.sandbox.create()

    const stubRequestResult = () => q({body: {sessionId: '', value: ''}})

    const assertRequestUri = (key, value) => {
        const requestOpts = RequestHandler.prototype.request.lastCall.args[0]

        assert.equal(requestOpts.uri[key], value)
    }

    beforeEach(() => sandbox.stub(RequestHandler.prototype, 'request').returns(stubRequestResult()))

    afterEach(() => sandbox.restore())

    it('should configure request protocol', () => {
        const client = remote({protocol: 'http'})

        client.configureHttp({protocol: 'https'})

        return client.init().then(() => assertRequestUri('protocol', 'https:'))
    })

    it('should configure request host', () => {
        const client = remote({hostname: '127.0.0.1'})

        client.configureHttp({hostname: 'localhost'})

        return client.init().then(() => assertRequestUri('hostname', 'localhost'))
    })

    it('should configure request port', () => {
        const client = remote({port: '4444'})

        client.configureHttp({port: '8080'})

        return client.init().then(() => assertRequestUri('port', '8080'))
    })

    it('should configure request timeout', () => {
        const client = remote({connectionRetryTimeout: 90000})

        client.configureHttp({connectionRetryTimeout: 5000})

        return client.init()
            .then(() => assert.calledWithMatch(RequestHandler.prototype.request, {timeout: 5000}))
    })

    it('should configure request retry count', () => {
        const client = remote({connectionRetryCount: 3})

        client.configureHttp({connectionRetryCount: 0})

        return client.init()
            .then(() => assert.calledWith(RequestHandler.prototype.request, sinon.match.any, 0))
    })
})
