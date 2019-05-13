import logger from '@wdio/logger'
var request = require('request')

const log = logger('@wdio/crossbrowsertesting-service')

const jobDataProperties = ['name', 'tags', 'public', 'build', 'extra']

export default class CrossBrowserTestingService {
    constructor () {
        this.testCnt = 0
        this.failures = 0
    }

    beforeSession (config, capabilities) {
        this.config = config
        this.capabilities = capabilities
        this.config.user = config.user
        this.config.key = config.key
        this.cbtUsername = this.config.user
        this.cbtAuthkey = this.config.pass
        this.isServiceEnabled = this.cbtUsername && this.cbtAuthkey
    }

    beforeSuite (suite) {
        this.suiteTitle = suite.title
    }

    beforeTest () {
        if (!this.isServiceEnabled) {
            return
        }
    }

    afterSuite (suite) {
        if (suite.hasOwnProperty('error')) {
            this.failures++
        }
    }

    afterTest (test) {
        if (!test.passed) {
            ++this.failures
        }
    }

    after (result) {
        if (!this.isServiceEnabled) {
            return
        }

        let failures = this.failures

        if (global.browser.config.mochaOpts && global.browser.config.mochaOpts.bail && Boolean(result)) {
            failures = 1
        }

        const status = 'status: ' + (failures > 0 ? 'failing' : 'passing')

        if (!global.browser.isMultiremote) {
            log.info(`Update job with sessionId ${global.browser.sessionId}, ${status}`)
            return this.updateJob(global.browser.sessionId, failures)
        }

        return Promise.all(Object.keys(this.capabilities).map((browserName) => {
            log.info(`Update multiremote job for browser "${browserName}" and sessionId ${global.browser[browserName].sessionId}, ${status}`)
            return this.updateJob(global.browser[browserName].sessionId, failures, false, browserName)
        }))
    }

    getSessionUrl (sessionId) {
        return `https://crossbrowsertesting.com/api/v3/selenium/${sessionId}`
    }

    onReload (oldSessionId, newSessionId) {
        if (!this.isServiceEnabled) {
            return
        }
        const status = 'status: ' + (this.failures > 0 ? 'failing' : 'passing')

        if (!global.browser.isMultiremote) {
            log.info(`Update (reloaded) job with sessionId ${oldSessionId}, ${status}`)
            return this.updateJob(oldSessionId, this.failures, true)
        }

        const browserName = global.browser.instances.filter(
            (browserName) => global.browser[browserName].sessionId === newSessionId)[0]
        log.info(`Update (reloaded) multiremote job for browser "${browserName}" and sessionId ${oldSessionId}, ${status}`)
        return this.updateJob(oldSessionId, this.failures, true, browserName)
    }

    updateJob (sessionId, failures, calledOnReload = false) {
        return new Promise((resolve, reject) => request.put(this.getSessionUrl(sessionId), {
            json: true,
            auth: {
                user: this.cbtUsername,
                pass: this.cbtAuthkey
            },
            body: this.getBody(failures, calledOnReload)
        }, (e, res, body) => {
            if (e) {
                return reject(e)
            }
            global.browser.jobData = body
            this.failures = 0
            resolve(body)
        }))
    }

    getBody (failures, calledOnReload = false) {
        let body = {}
        body.name = this.suiteTitle
        if (calledOnReload || this.testCnt) {
            body.name += ` (${++this.testCnt})`
        }

        for (let prop of jobDataProperties) {
            if (!this.capabilities[prop]) {
                continue
            }

            body[prop] = this.capabilities[prop]
        }

        body.passed = failures === 0
        return body
    }
}
