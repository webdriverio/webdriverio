import path from 'path'
import nock from 'nock'
import chai from 'chai'
import merge from 'deepmerge'
import chaiString from 'chai-string'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import http from 'http'
import { Server } from 'node-static'

import { remote } from '../index'

const BUILD_ENV = (process.env.npm_lifecycle_event || '').split(':').pop()

/**
 * setup chai
 */
chai.should()
chai.use(chaiString)
chai.use(chaiAsPromised)
global.assert = chai.assert
global.expect = chai.expect

/**
 * setup sinon
 */
global.sinon = sinon
sinon.assert.expose(chai.assert, {prefix: ''})

/**
 * provide simplified mock interface
 */
const NOCK_HOST = 'http://127.0.0.1:4444'
nock.disableNetConnect()

global.mock = function (method, path, reply, post, status = 200) {
    if (post) {
        post = { parameters: post }
    }

    return nock(NOCK_HOST)[method]('/wd/hub' + path, post).reply(status, merge({
        sessionId: '123ABC',
        status: status === 200 ? 0 : status,
        value: {}
    }, reply || {}))
}

global.setupInstance = async function () {
    this.client = remote({})

    const createSession = global.mock('post', '/session')
    await this.client.init()
    createSession.isDone().should.be.true
}

/**
 * start static service only for wdio build
 */
before(async function () {
    if (process.env.CI && BUILD_ENV !== 'wdio') {
        return
    }

    const file = new Server(path.resolve(__dirname, 'site', 'www'))
    this.server = http.createServer((request, response) =>
        request.addListener('end', () => file.serve(request, response)).resume()
    ).listen(8080)
})

after(async function () {
    if (this.server) {
        this.server.close()
    }

    nock.restore()
})
