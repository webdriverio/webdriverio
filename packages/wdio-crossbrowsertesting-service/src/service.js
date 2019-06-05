import request from 'request'
import logger from '@wdio/logger'

const log = logger('@wdio/crossbrowsertesting-service')
const jobDataProperties = ['name', 'tags', 'public', 'build', 'extra']

export default class CrossBrowserTestingService {
    constructor () {
        this.testCnt = 0
        this.failures = 0
    }

    /**
     * gather information about runner
     */
    beforeSession (config, capabilities) {
        this.config = config
        this.capabilities = capabilities
        this.config.user = config.user
        this.config.key = config.key
        this.cbtUsername = this.config.user
        this.cbtAuthkey = this.config.key

        this.isServiceEnabled = this.cbtUsername && this.cbtAuthkey
    }

    /**
     * Before suite
     * @param {Object} suite Suite
    */
    beforeSuite (suite) {
        this.suiteTitle = suite.title
    }

    /**
     * Before test
     * @param {Object} test Test
    */
    beforeTest (test) {
        if (!this.isServiceEnabled) {
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

        const context = test.parent === 'Jasmine__TopLevel__Suite' ? test.fullName : test.parent + ' - ' + test.title

        global.browser.execute('cbt:test-context=' + context)
    }

    afterSuite (suite) {
        if (suite.hasOwnProperty('error')) {
            ++this.failures
        }
    }

    /**
     * After test
     * @param {Object} test Test
     */
    afterTest (test) {
        if (!test.passed) {
            ++this.failures
        }
    }

    /**
     * Before feature
     * @param {Object} feature Feature
     */
    beforeFeature (feature) {
        if (!this.isServiceEnabled) {
            return
        }

        this.suiteTitle = feature.name || feature.getName()
        global.browser.execute('cbt:test-context=Feature: ' + this.suiteTitle)
    }

    /**
     * After step
     * @param {Object} feature Feature
     */
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

    /**
     * Before scenario
     * @param {Object} scenario Scenario
     */
    beforeScenario (scenario) {
        if (!this.isServiceEnabled) {
            return
        }
        const scenarioName = scenario.name || scenario.getName()
        global.browser.execute('cbt:test-context=Scenario: ' + scenarioName)
    }

    /**
     * Update info
     * @return {Promise} Promsie with result of updateJob method call
     */
    after (result) {
        if (!this.isServiceEnabled) {
            return
        }

        let failures = this.failures

        /**
         * set failures if user has bail option set in which case afterTest and
         * afterSuite aren't executed before after hook
         */
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

    updateJob (sessionId, failures, calledOnReload = false, browserName) {
        return new Promise((resolve, reject) => request.put(this.getRestUrl(sessionId), {
            json: true,
            auth: {
                user: this.cbtUsername,
                pass: this.cbtAuthkey
            },
            body: this.getBody(failures, calledOnReload, browserName)
        }, (e, res, body) => {
            /* istanbul ignore if */
            this.failures = 0
            if (e) {
                return reject(e)
            }
            global.browser.jobData = body
            return resolve(body)
        }))
    }

    /**
     *
     * @param {String} sessionId Session id
     * @returns {String}
     */
    getRestUrl (sessionId) {
        return `https://crossbrowsertesting.com/api/v3/selenium/${sessionId}`
    }

    getBody (failures, calledOnReload = false, browserName) {
        let body = { test: {} }

        /**
         * set default values
         */
        body.test['name'] = this.suiteTitle

        /**
         * add reload count to title if reload is used
         */
        if (calledOnReload || this.testCnt) {
            let testCnt = ++this.testCnt
            if (global.browser.isMultiremote) {
                testCnt = Math.ceil(testCnt / global.browser.instances.length)
            }

            body.test['name'] += ` (${testCnt})`
        }

        for (let prop of jobDataProperties) {
            if (!this.capabilities[prop]) {
                continue
            }

            body.test[prop] = this.capabilities[prop]
        }

        if (browserName) {
            body.test['name'] = `${browserName}: ${body.test['name']}`
        }

        body.test['success'] = failures === 0 ? '1' : '0'
        return body
    }
}
