import request from 'request'
import logger from '@wdio/logger'
import { getSauceEndpoint } from '@wdio/config'

const jobDataProperties = ['name', 'tags', 'public', 'build', 'custom-data']

const jasmineTopLevelSuite = 'Jasmine__TopLevel__Suite'

const log = logger('wdio-sauce-service')

export default class SauceService {
    constructor (config) {
        this.config = config
    }

    /**
     * gather information about runner
     */
    before (capabilities) {
        this.capabilities = capabilities
        this.sauceUser = this.config.user
        this.sauceKey = this.config.key
        this.hostname = getSauceEndpoint(this.config.region)
        this.testCnt = 0
        this.failures = 0 // counts failures between reloads
    }

    getSauceRestUrl (sessionId) {
        return `https://${this.hostname}/rest/v1/${this.sauceUser}/jobs/${sessionId}`
    }

    beforeSuite (suite) {
        this.suiteTitle = suite.title
    }

    beforeTest (test) {
        if (!this.sauceUser || !this.sauceKey) {
            return
        }

        /**
         * in jasmine we get Jasmine__TopLevel__Suite as title since service using test
         * framework hooks in order to execute async functions.
         * This tweak allows us to set the real suite name for jasmine jobs.
         */
        /* istanbul ignore if */
        if (this.suiteTitle === 'Jasmine__TopLevel__Suite') {
            this.suiteTitle = test.fullName.slice(0, test.fullName.indexOf(test.title) - 1)
        }

        const context = test.parent === jasmineTopLevelSuite ? test.fullName : test.parent + ' - ' + test.title

        global.browser.execute('sauce:context=' + context)
    }

    afterSuite (suite) {
        if (suite.hasOwnProperty('error')) {
            ++this.failures
        }
    }

    afterTest (test) {
        if (!test.passed) {
            ++this.failures
        }
    }

    beforeFeature (feature) {
        if (!this.sauceUser || !this.sauceKey) {
            return
        }

        this.suiteTitle = feature.name || feature.getName()
        global.browser.execute('sauce:context=Feature: ' + this.suiteTitle)
    }

    afterStep (feature) {
        if (
            /**
             * Cucumber v1
             */
            feature.failureException ||
            /**
             * Cucumber v2
             */
            (typeof feature.getFailureException === 'function' && feature.getFailureException()) ||
            /**
             * Cucumber v3, v4
             */
            (feature.status === 'failed')
        ) {
            ++this.failures
        }
    }

    beforeScenario (scenario) {
        if (!this.sauceUser || !this.sauceKey) {
            return
        }

        const scenarioName = scenario.name || scenario.getName()
        global.browser.execute('sauce:context=Scenario: ' + scenarioName)
    }

    /**
     * update Sauce Labs job
     */
    after () {
        if (!this.sauceUser || !this.sauceKey) {
            return
        }

        const status = 'status: ' + (this.failures > 0 ? 'failing' : 'passing')

        if (!global.browser.isMultiremote) {
            log.info(`Update job with sessionId ${global.browser.sessionId}, ${status}`)
            return this.updateJob(global.browser.sessionId, this.failures)
        }

        return Promise.all(Object.keys(this.capabilities).map((browserName) => {
            log.info(`Update multiremote job for browser "${browserName}" and sessionId ${global.browser[browserName].sessionId}, ${status}`)
            return this.updateJob(global.browser[browserName].sessionId, this.failures, false, browserName)
        }))
    }

    onReload (oldSessionId, newSessionId) {
        if (!this.sauceUser || !this.sauceKey) {
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

    updateJob (sessionId, failures, calledOnReload = false, browserName) {
        return new Promise((resolve, reject) => request.put(this.getSauceRestUrl(sessionId), {
            json: true,
            auth: {
                user: this.sauceUser,
                pass: this.sauceKey
            },
            body: this.getBody(failures, calledOnReload, browserName)
        }, (e, res, body) => {
            /* istanbul ignore if */
            if (e) {
                return reject(e)
            }
            global.browser.jobData = body
            this.failures = 0
            return resolve(body)
        }))
    }

    /**
     * massage data
     */
    getBody (failures, calledOnReload = false, browserName) {
        let body = {}

        /**
         * set default values
         */
        body.name = this.suiteTitle

        if (browserName) {
            body.name = `${browserName}: ${body.name}`
        }

        /**
         * add reload count to title if reload is used
         */
        if (calledOnReload || this.testCnt) {
            let testCnt = ++this.testCnt

            if (global.browser.isMultiremote) {
                testCnt = Math.ceil(testCnt / global.browser.instances.length)
            }

            body.name += ` (${testCnt})`
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
