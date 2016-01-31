import chai from 'chai'
import merge from 'deepmerge'
import nock from 'nock'
import conf from '../../conf/index.js'

const expect = chai.expect
const WebdriverIO = require('../../../')

const FAKE_SUCCESS_RESPONSE = {
    sessionId: '31571f3a-4824-4378-b352-65de24952903',
    status: 0
}

describe('connection retries', () => {
    afterEach(() => nock.cleanAll())

    it('should retry connection 3 times if network error occurs', async function () {
        // mock 2 request errors and third successful
        nock('http://localhost:4444')
            .post('/wd/hub/session')
                .twice()
                .replyWithError('some error')
            .post('/wd/hub/session')
                .reply(200, FAKE_SUCCESS_RESPONSE)

        await WebdriverIO.remote(conf).init()
    })

    it('should fail with ECONNREFUSED if all connection attempts failed', async function () {
        // mock 3 request errors
        nock('http://localhost:4444')
            .post('/wd/hub/session')
            .thrice()
            .replyWithError('some error')

        await WebdriverIO.remote(conf).init().catch(err => {
            expect(err).not.to.be.undefined
            expect(err.message).to.equal('Couldn\'t connect to selenium server')
            expect(err.seleniumStack.type).to.equal('ECONNREFUSED')
        })
    })

    it('should use connectionRetryTimeout option in requests retrying', async function () {
        // mock 1 slow request and 1 successful one
        nock('http://localhost:4444')
            .post('/wd/hub/session')
                .delayConnection(5000)
                .reply(200, 'some response')
            .post('/wd/hub/session')
                .reply(200, FAKE_SUCCESS_RESPONSE)

        const start = Date.now()

        const localConf = merge({}, conf)
        localConf.connectionRetryTimeout = 3000

        await WebdriverIO.remote(localConf).init().then(() => {
            const connectionTime = Date.now() - start

            expect(connectionTime).to.be.above(3000)
            expect(connectionTime).to.be.below(4000)
        })
    })

    it('should use connectionRetryCount option in requests retrying', async function () {
        // mock 12 request errors
        nock('http://localhost:4444')
            .post('/wd/hub/session')
                .times(12)
                .replyWithError('some error')
            .post('/wd/hub/session')
                .reply(200, FAKE_SUCCESS_RESPONSE)

        const localConf = merge({}, conf)
        localConf.connectionRetryCount = 15

        await WebdriverIO.remote(localConf).init()
    })
})
