import http from 'http'
import path from 'path'

import SauceLabs from 'saucelabs'
import chai from 'chai'
import chaiString from 'chai-string'
import chaiThings from 'chai-things'
import chaiAsPromised from 'chai-as-promised'
import SauceConnectLauncher from 'sauce-connect-launcher'
import { Server } from 'node-static'

import conf from './conf/index'
import { remote, multiremote } from '../index'

const SC_REQUIRED_BUILDS = ['desktop', 'ios', 'android']
const BUILD_ENV = (process.env.npm_lifecycle_event || '').split(':').pop()
console.log('==> Build environment', BUILD_ENV)

global.conf = conf

/**
 * setup chai
 */
chai.should()
chai.use(chaiString)
chai.use(chaiThings)
chai.use(chaiAsPromised)
global.assert = chai.assert
global.expect = chai.expect

before(async function () {
    /**
     * start static service
     */
    const file = new Server(path.resolve(__dirname, 'site', 'www'))
    this.server = http.createServer((request, response) =>
        request.addListener('end', () => file.serve(request, response)).resume()
    ).listen(8080)

    if (BUILD_ENV === 'multibrowser') {
        this.client = multiremote(conf.capabilities)
        await this.client.init()
        this.browserA = this.client.select('browserA')
        this.browserB = this.client.select('browserB')
        return
    }

    if (SC_REQUIRED_BUILDS.indexOf(BUILD_ENV) > -1 && process.env.TRAVIS_JOB_NUMBER) {
        console.log('==> Trying to start Sauce Connect')

        this.scProcess = await new Promise((resolve, reject) => {
            SauceConnectLauncher({
                user: process.env.SAUCE_USERNAME,
                key: process.env.SAUCE_ACCESS_KEY,
                tunnelIdentifier: process.env.TRAVIS_JOB_NUMBER
            }, (err, p) => {
                if (err) {
                    console.error('==> Couldn\'t start Sauce Connect due to:', err.message)
                    return reject(err)
                }

                console.log('==> Started Sauce Connect with tunnel-identifier', process.env.TRAVIS_JOB_NUMBER)
                resolve(p)
            })
        })
    }

    this.client = remote(conf)

    delete conf.desiredCapabilities.accessKey
    console.log('Running job with following conf:', conf, '\n\n')

    await this.client.init()
})

beforeEach(async function () {
    if (BUILD_ENV && BUILD_ENV.match(/(android|ios)/)) {
        return
    }

    await this.client.url(conf.testPage.start)
})

after(async function () {
    const sessionId = this.client.requestHandler.sessionID
    await this.client[(BUILD_ENV && BUILD_ENV.match(/(multibrowser|android)/)) || process.env.CI ? 'end' : 'endAll']()

    /**
     * shut down static server
     */
    if (this.server) {
        this.server.close()
    }

    /**
     * shut down sauce connect
     */
    if (this.scProcess) {
        this.scProcess.close()
    }

    /**
     * if we are not running on travis we are done here
     */
    if (!process.env.CI || !BUILD_ENV || !BUILD_ENV.match(/(desktop|ios|android)/)) {
        return
    }

    /**
     * return early if no suites were run
     */
    if (!this._runnable.parent.suites || !this._runnable.parent.suites.length) {
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
