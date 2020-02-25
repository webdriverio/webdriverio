import LambdaRestClient from '@lambdatest/node-rest-client'
import logger from '@wdio/logger'

const log = logger('@wdio/lambdatest-service')

export default class LambdaRestService {
    constructor() {
        this.testCnt = 0
        this.failures = 0 // counts failures between reloads
    }

    // gather information about runner
    beforeSession(config, capabilities) {
        this.config = config
        this.capabilities = capabilities
        const lambdaCredentials = {
            username: this.config.user,
            accessKey: this.config.key
        }
        this.isServiceEnabled =
            lambdaCredentials.username && lambdaCredentials.accessKey
        try {
            this.api = LambdaRestClient.AutomationClient(lambdaCredentials)
        } catch (_) {
            this.isServiceEnabled = false
        }
    }

    beforeSuite(suite) {
        this.suiteTitle = suite.title
    }

    beforeTest(test) {
        if (!this.isServiceEnabled) {
            return
        }
        if (this.suiteTitle === 'Jasmine__TopLevel__Suite') {
            this.suiteTitle = test.fullName.slice(
                0,
                test.fullName.indexOf(test.title) - 1
            )
        }
    }

    afterSuite(suite) {
        if (Object.prototype.hasOwnProperty.call(suite, 'error')) {
            ++this.failures
        }
    }

    afterTest(test) {
        if (!test.passed) {
            ++this.failures
        }
    }

    afterScenario(uri, feature, pickle, result) {
        if (result.status === 'failed') {
            ++this.failures
        }
    }

    after(result) {
        if (!this.isServiceEnabled) {
            return
        }

        let failures = this.failures
        if (
            global.browser.config.mochaOpts &&
            global.browser.config.mochaOpts.bail &&
            Boolean(result)
        ) {
            failures = 1
        }

        const status = 'status: ' + (failures > 0 ? 'failed' : 'passed')

        if (!global.browser.isMultiremote) {
            log.info(
                `Update job with sessionId ${global.browser.sessionId}, ${status}`
            )
            return this.updateJob(global.browser.sessionId, failures)
        }

        return Promise.all(
            Object.keys(this.capabilities).map(browserName => {
                log.info(
                    `Update multiremote job for browser '${browserName}' and sessionId ${global.browser[browserName].sessionId}, ${status}`
                )
                return this.updateJob(
                    global.browser[browserName].sessionId,
                    failures,
                    false,
                    browserName
                )
            })
        )
    }

    onReload(oldSessionId, newSessionId) {
        if (!this.isServiceEnabled) {
            return
        }

        const status = 'status: ' + (this.failures > 0 ? 'failed' : 'passed')

        if (!global.browser.isMultiremote) {
            log.info(
                `Update (reloaded) job with sessionId ${oldSessionId}, ${status}`
            )
            return this.updateJob(oldSessionId, this.failures, true)
        }

        const browserName = global.browser.instances.filter(
            browserName =>
                global.browser[browserName].sessionId === newSessionId
        )[0]
        log.info(
            `Update (reloaded) multiremote job for browser '${browserName}' and sessionId ${oldSessionId}, ${status}`
        )
        return this.updateJob(oldSessionId, this.failures, true, browserName)
    }

    async updateJob(sessionId, failures, calledOnReload = false, browserName) {
        const body = this.getBody(failures, calledOnReload, browserName)
        await new Promise((resolve, reject) => {
            this.api.updateSessionById(sessionId, body, (err, result) => {
                if (err) {
                    return reject(err)
                }
                return resolve(result)
            })
        })
        this.failures = 0
    }

    getBody(failures, calledOnReload = false, browserName) {
        let body = {}
        body.name = this.suiteTitle

        if (browserName) {
            body.name = `${browserName}: ${body.name}`
        }
        if (calledOnReload || this.testCnt) {
            let testCnt = ++this.testCnt

            if (global.browser.isMultiremote) {
                testCnt = Math.ceil(testCnt / global.browser.instances.length)
            }

            body.name += ` (${testCnt})`
        }
        body.status_ind = failures > 0 ? 'failed' : 'passed'
        return body
    }
}