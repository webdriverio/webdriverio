import got from 'got'
import logger from '@wdio/logger'

const log = logger('@wdio/testingbot-service')
const jobDataProperties = ['name', 'tags', 'public', 'build', 'extra']

export default class TestingBotService {
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
        this.tbUser = this.config.user
        this.tbSecret = this.config.key

        this.isServiceEnabled = this.tbUser && this.tbSecret
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

        const context = (
            /**
             * Jasmine
             */
            test.fullName ||
            /**
             * Mocha
             */
            `${test.parent} - ${test.title}`
        )
        global.browser.execute('tb:test-context=' + context)
    }

    afterSuite (suite) {
        if (Object.prototype.hasOwnProperty.call(suite, 'error')) {
            ++this.failures
        }
    }

    /**
     * After test
     * @param {Object} test Test
     */
    afterTest (test, context, results) {
        if (!results.passed) {
            ++this.failures
        }
    }

    /**
     * For CucumberJS
     */

    /**
     * Before feature
     * @param {string} uri
     * @param {Object} feature
     */
    beforeFeature (uri, feature) {
        if (!this.isServiceEnabled) {
            return
        }

        this.suiteTitle = feature.document.feature.name
        global.browser.execute('tb:test-context=Feature: ' + this.suiteTitle)
    }

    /**
     * Before scenario
     * @param {string} uri
     * @param {Object} feature
     * @param {Object} scenario
     */
    beforeScenario (uri, feature, scenario) {
        if (!this.isServiceEnabled) {
            return
        }
        const scenarioName = scenario.name
        global.browser.execute('tb:test-context=Scenario: ' + scenarioName)
    }

    /**
     * After scenario
     * @param {string} uri
     * @param {Object} feature
     * @param {Object} pickle
     * @param {Object} result
     */
    afterScenario(uri, feature, pickle, result) {
        if (result.status === 'failed') {
            ++this.failures
        }
    }

    /**
     * Update TestingBot info
     * @return {Promise} Promise with result of updateJob method call
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

    async updateJob (sessionId, failures, calledOnReload = false, browserName) {
        const json = this.getBody(failures, calledOnReload, browserName)
        this.failures = 0
        const response = await got.put(this.getRestUrl(sessionId), {
            json,
            responseType: 'json',
            username: this.tbUser,
            password: this.tbSecret
        })

        global.browser.jobData = response.body
        return response.body
    }

    /**
     *
     * @param   {String} sessionId Session id
     * @returns {String}           TestingBot API URL
     */
    getRestUrl (sessionId) {
        return `https://api.testingbot.com/v1/tests/${sessionId}`
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
