import merge from 'deepmerge'
import nock from 'nock'
import conf from '../../conf/index.js'

const WebdriverIO = require('../../../')

const FAKE_SUCCESS_RESPONSE = {
    sessionId: '31571f3a-4824-4378-b352-65de24952903',
    status: 0
}

describe('connection retries', () => {
    afterEach(() => nock.cleanAll())

    it('should retry connection 3 times if network error occurs', async function () {
        // mock 3 request errors and 4th successful
        nock('http://localhost:4444')
            .post('/wd/hub/session')
                .thrice()
                .replyWithError('some error')
            .post('/wd/hub/session')
                .reply(200, FAKE_SUCCESS_RESPONSE)

        await WebdriverIO.remote(conf).init()
    })

    it('should fail with ECONNREFUSED if all connection attempts failed', async function () {
        // mock 4 request errors (3 of them retries)
        nock('http://localhost:4444')
            .post('/wd/hub/session')
            .times(4)
            .replyWithError('some error')

        await WebdriverIO.remote(conf).init().catch(err => {
            expect(err).not.to.be.undefined
            expect(err.message).to.equal('Couldn\'t connect to selenium server')
            expect(err.seleniumStack.type).to.equal('ECONNREFUSED')
        })
    })

    it('should fail with ECONNREFUSED on first attempt if connectionRetryCount is set as zero', async function () {
        // mock 1 request error
        nock('http://localhost:4444')
            .post('/wd/hub/session')
            .replyWithError('some error')

        const localConf = merge({}, conf)
        localConf.connectionRetryCount = 0

        await WebdriverIO.remote(localConf).init().catch(err => {
            expect(err).not.to.be.undefined
            expect(err.message).to.equal('Couldn\'t connect to selenium server')
            expect(err.seleniumStack.type).to.equal('ECONNREFUSED')
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

    it.skip('should use connectionRetryTimeout option in requests retrying', async function () {
        // mock 1 slow request and 1 successful one
        nock('http://localhost:4444')
            .post('/wd/hub/session')
                .delayConnection(5000)
                .reply(200, 'some response')
            .post('/wd/hub/session')
                .reply(200, FAKE_SUCCESS_RESPONSE)

        const start = Date.now()

        const localConf = merge({
            logLevel: 'verbose'
        }, conf)
        localConf.connectionRetryTimeout = 3000

        await WebdriverIO.remote(localConf).init().then(() => {
            const connectionTime = Date.now() - start

            expect(connectionTime).to.be.above(3000)
            expect(connectionTime).to.be.below(4000)
        })
    })
})
