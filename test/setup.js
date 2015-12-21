import { remote } from '../index'
import SauceLabs from 'saucelabs'
import chai from 'chai'
import chaiString from 'chai-string'
import chaiAsPromised from 'chai-as-promised'

import conf from './conf/index'
global.conf = conf

/**
 * setup chai
 */
chai.should()
chai.use(chaiString)
chai.use(chaiAsPromised)
global.assert = chai.assert
global.expect = chai.expect

before(async function () {
    this.client = remote(conf)
    await this.client.init()
})

beforeEach(async function() {
    await this.client.url(conf.testPage.start)
})

after(async function () {
    const sessionId = this.client.requestHandler.sessionID
    await this.client.endAll()

    /**
     * if we are not running on travis we are done here
     */
    if (!process.env.CI || !process.env._ENV || !process.env._ENV.match(/(desktop|mobile)/)) {
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

    await new Promise((r) => {
        account.updateJob(sessionId, {
            passed: failures === 0,
            public: true
        }, r)
    })
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

/**
 * general helper global
 */
global.h = {
    noError: (err, msg) => {
        (err === undefined).should.be.equal(true, msg)
    },
    checkResult: (expected) => {
        return (result) => {
            if (Array.isArray(expected)) {
                return expected.should.containDeep([result])
            }
            expected.should.be.exactly(result)
        }
    },
    instanceLoop: (cb) => {
        var self = this
        Object.keys(this.matrix.instances).forEach((instanceName) =>
            cb.call(self, self.matrix[instanceName])
        )
    }
}
