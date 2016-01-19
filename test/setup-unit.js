import { remote } from '../index'
import nock from 'nock'
import chai from 'chai'
import merge from 'deepmerge'
import chaiString from 'chai-string'
import chaiAsPromised from 'chai-as-promised'

/**
 * setup chai
 */
chai.should()
chai.use(chaiString)
chai.use(chaiAsPromised)
global.assert = chai.assert
global.expect = chai.expect

/**
 * provide simplified mock interface
 */
const NOCK_HOST = 'http://127.0.0.1:4444'
nock.disableNetConnect()

global.mock = function (method, path, reply, post) {
    if (post) {
        post = { parameters: post }
    }

    return nock(NOCK_HOST)[method]('/wd/hub' + path, post).reply(200, merge({
        sessionId: '123ABC',
        status: 0,
        value: {}
    }, reply || {}))
}

global.setupInstance = async function () {
    this.client = remote({})

    const createSession = global.mock('post', '/session')
    await this.client.init()
    createSession.isDone().should.be.true
}

after(async function () {
    nock.restore()
})
