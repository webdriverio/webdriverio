import http from 'http'
import path from 'path'

import SauceLabs from 'saucelabs'
import chai from 'chai'
import chaiString from 'chai-string'
import chaiThings from 'chai-things'
import chaiAsPromised from 'chai-as-promised'
import { Server } from 'node-static'

import conf from './conf/index'
import { remote, multiremote } from '../index'

if (process.env.npm_lifecycle_event === 'test:desktop' && !process.env._BROWSER) {
    process.env._BROWSER = 'chrome'
}

global.conf = conf

/**
 * skip desktop and mobile tests on PRs
 */
if (process.env.TRAVIS_PULL_REQUEST && process.env.TRAVIS_PULL_REQUEST !== 'false') {
    console.log('desktop and mobile tests are not relevant for PR tests')
    console.log('shutting down with exit code 0')
    process.exit(0)
}

/**
 * setup chai
 */
chai.should()
chai.use(chaiString)
chai.use(chaiThings)
chai.use(chaiAsPromised)
global.assert = chai.assert
global.expect = chai.expect

let server

before(async function () {
    /**
     * start static service
     */
    const file = new Server(path.resolve(__dirname, 'site', 'www'))
    server = http.createServer((request, response) =>
        request.addListener('end', () => file.serve(request, response)).resume()
    ).listen(8080)

    if (process.env.npm_lifecycle_event === 'test:multibrowser') {
        this.client = multiremote(conf.capabilities)
        await this.client.init()
        this.browserA = this.client.select('browserA')
        this.browserB = this.client.select('browserB')
        return
    }

    this.client = remote(conf)

    delete conf.desiredCapabilities.accessKey
    console.log('Running job with following conf:', conf, '\n\n')

    await this.client.init()
})

beforeEach(async function () {
    if (process.env._ENV && process.env._ENV.match(/(android|ios)/)) {
        return
    }

    await this.client.url(conf.testPage.start)
})

after(async function () {
    const sessionId = this.client.requestHandler.sessionID
    await this.client[(process.env._ENV && process.env._ENV.match(/(multibrowser|android)/)) || process.env.CI ? 'end' : 'endAll']()

    if (server) {
        server.close()
    }

    /**
     * if we are not running on travis we are done here
     */
    if (!process.env.CI || !process.env._ENV || !process.env._ENV.match(/(desktop|ios|android)/)) {
        return
    }

    /**
     * if not update the job ob sauce
     */
    const failures = getFailures(this._runnable.parent)
    const account = new SauceLabs({
        username: process.env.SAUCE_USERNAME,
        password: process.env.SAUCE_ACCESS_KEY
    })

    let newJobStatus = {
        passed: failures === 0,
        public: true
    }

    let res = await new Promise((resolve) => {
        console.log(`update job status of ${sessionId}`, newJobStatus)
        account.updateJob(sessionId, newJobStatus, resolve)
    })

    console.log('successfully updated job:', res)
})

function getFailures (suite) {
    let failures = 0

    if (suite.suites && suite.suites.length) {
        for (let s of suite.suites) {
            failures += getFailures(s)
        }
    }

    if (suite.tests && suite.tests.length) {
        for (let t of suite.tests) {
            failures += t.state === 'failed' ? 1 : 0
        }
    }

    return failures
}
