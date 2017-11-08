import proxyquire from 'proxyquire'
import { RuntimeError } from './ErrorHandler'

describe('RequestHandler', () => {
    const sandbox = sinon.sandbox.create()
    let RequestHandler
    let request

    const initRequestHandler = (opts = {}) => {
        RequestHandler = proxyquire('../../../lib/utils/RequestHandler', {request})
        return new RequestHandler(opts)
    }

    const mkRequest = (opts = {}) => {
        const {fullRequestOptions = {}, totalRetryCount = 0, retryCount = 0} = opts

        return initRequestHandler().request(fullRequestOptions, totalRetryCount, retryCount)
    }

    beforeEach(() => {
        request = sandbox.stub()
    })

    afterEach(() => sandbox.restore())

    describe('request', () => {
        it('should be rejected if http call is failed', () => {
            request.yields(new Error('some-error'))

            return assert.isRejected(mkRequest(), RuntimeError, /some-error/)
        })

        it('should be fulfilled if http call returns valid body result', () => {
            const response = {}
            const body = {status: 0}
            request.yields(null, response, body)

            return assert.becomes(mkRequest(), {body, response})
        })

        it('should be fulfilled even if http call returns empty body result', () => {
            const response = {}
            const body = null
            request.yields(null, response, body)

            return assert.becomes(mkRequest(), {body, response})
        })
    })
})
