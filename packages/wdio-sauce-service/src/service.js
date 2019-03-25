import SauceLabs from 'saucelabs'
import logger from '@wdio/logger'

const jobDataProperties = ['name', 'tags', 'public', 'build', 'custom-data']

const jasmineTopLevelSuite = 'Jasmine__TopLevel__Suite'

const log = logger('@wdio/sauce-service')

export default class SauceService {
    constructor (config) {
        this.config = config
    }

    /**
     * if no user and key is specified even though a sauce service was
     * provided set user and key with values so that the session request
     * will fail
     */
    beforeSession (config) {
        if (!config.user) {
            config.user = 'unknown_user'
        }
        if (!config.key) {
            config.key = 'unknown_key'
        }

        this.config.user = config.user
        this.config.key = config.key
    }

    /**
     * gather information about runner
     */
    before (capabilities) {
        this.capabilities = capabilities
        this.sauceUser = this.config.user
        this.sauceKey = this.config.key
        this.api = new SauceLabs(this.config)
        this.testCnt = 0
        this.failures = 0 // counts failures between reloads
        this.isRDC = 'testobject_api_key' in this.capabilities
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
    after (result) {
        if ((!this.sauceUser || !this.sauceKey) && !this.isRDC) {
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
        if ((!this.sauceUser || !this.sauceKey) && !this.isRDC) {
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
        if (this.isRDC) {
            await this.api.updateTest(sessionId, { passed: failures === 0 })
            this.failures = 0
            return
        }

        const body = this.getBody(failures, calledOnReload, browserName)
        await this.api.updateJob(this.sauceUser, sessionId, body)
        this.failures = 0
    }

    /**
     * VM message data
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
