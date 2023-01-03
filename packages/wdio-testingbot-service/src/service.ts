import got from 'got'
import logger from '@wdio/logger'
import type { Capabilities, Options, Services, Frameworks } from '@wdio/types'

import type { TestingbotOptions } from './types.js'

const log = logger('@wdio/testingbot-service')
const jobDataProperties = ['name', 'tags', 'public', 'build', 'extra']

export default class TestingBotService implements Services.ServiceInstance {
    private _browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    private _isServiceEnabled?: boolean
    private _suiteTitle?: string
    private _tbSecret?: string
    private _tbUser?: string
    private _failures = 0
    private _testCnt = 0

    constructor (
        private _options: TestingbotOptions,
        private _capabilities: Capabilities.RemoteCapability,
        private _config: Omit<Options.Testrunner, 'capabilities'>
    ) {
        this._tbUser = this._config.user
        this._tbSecret = this._config.key

        this._isServiceEnabled = Boolean(this._tbUser && this._tbSecret)
    }

    before (
        caps: unknown,
        specs: unknown,
        browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    ) {
        this._browser = browser
    }

    /**
     * Before suite
     * @param {Object} suite Suite
    */
    beforeSuite (suite: Frameworks.Suite) {
        this._suiteTitle = suite.title
    }

    /**
     * Before test
     * @param {Object} test Test
    */
    beforeTest (test: Frameworks.Test) {
        if (!this._isServiceEnabled || !this._browser) {
            return
        }

        /**
         * in jasmine we get Jasmine__TopLevel__Suite as title since service using test
         * framework hooks in order to execute async functions.
         * This tweak allows us to set the real suite name for jasmine jobs.
         */
        /* istanbul ignore if */
        if (this._suiteTitle === 'Jasmine__TopLevel__Suite') {
            this._suiteTitle = test.fullName.slice(0, test.fullName.indexOf(test.title) - 1)
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

        this._browser.execute('tb:test-context=' + context)
    }

    afterSuite (suite: Frameworks.Suite) {
        if (Object.prototype.hasOwnProperty.call(suite, 'error')) {
            ++this._failures
        }
    }

    /**
     * After test
     * @param {Object} test Test
     */
    afterTest (test: Frameworks.Test, context: any, results: Frameworks.TestResult) {
        if (!results.passed) {
            ++this._failures
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
    beforeFeature (uri: unknown, feature: { name: string }) {
        if (!this._isServiceEnabled || !this._browser) {
            return
        }

        this._suiteTitle = feature.name
        this._browser.execute('tb:test-context=Feature: ' + this._suiteTitle)
    }

    /**
     * Before scenario
     * @param {string} uri
     * @param {Object} feature
     * @param {Object} scenario
     */
    beforeScenario (world: Frameworks.World) {
        if (!this._isServiceEnabled || !this._browser) {
            return
        }
        const scenarioName = world.pickle.name
        this._browser.execute('tb:test-context=Scenario: ' + scenarioName)
    }

    /**
     *
     * Runs before a Cucumber Scenario.
     * @param world world object containing information on pickle and test step
     * @param result result object containing
     * @param result.passed   true if scenario has passed
     * @param result.error    error stack if scenario failed
     * @param result.duration duration of scenario in milliseconds
     */
    afterScenario(world: Frameworks.World, result: Frameworks.PickleResult) {
        // check if scenario has failed
        if (!result.passed) {
            ++this._failures
        }
    }

    /**
     * Update TestingBot info
     * @return {Promise} Promise with result of updateJob method call
     */
    after (result?: number) {
        if (!this._isServiceEnabled || !this._browser) {
            return
        }

        let failures = this._failures

        /**
         * set failures if user has bail option set in which case afterTest and
         * afterSuite aren't executed before after hook
         */
        if (this._config.mochaOpts?.bail && Boolean(result)) {
            failures = 1
        }

        const status = 'status: ' + (failures > 0 ? 'failing' : 'passing')

        if (!this._browser.isMultiremote) {
            log.info(`Update job with sessionId ${this._browser.sessionId}, ${status}`)
            return this.updateJob(this._browser.sessionId, failures)
        }

        const browser = this._browser as WebdriverIO.MultiRemoteBrowser
        return Promise.all(Object.keys(this._capabilities).map((browserName) => {
            log.info(`Update multiremote job for browser "${browserName}" and sessionId ${browser.getInstance(browserName).sessionId}, ${status}`)
            return this.updateJob(browser.getInstance(browserName).sessionId, failures, false, browserName)
        }))
    }

    onReload (oldSessionId: string, newSessionId: string) {
        if (!this._isServiceEnabled || !this._browser) {
            return
        }
        const status = 'status: ' + (this._failures > 0 ? 'failing' : 'passing')

        if (!this._browser.isMultiremote) {
            log.info(`Update (reloaded) job with sessionId ${oldSessionId}, ${status}`)
            return this.updateJob(oldSessionId, this._failures, true)
        }

        const browser = this._browser as WebdriverIO.MultiRemoteBrowser
        const browserName = browser.instances.filter(
            (browserName: string) => browser.getInstance(browserName).sessionId === newSessionId)[0]
        log.info(`Update (reloaded) multiremote job for browser "${browserName}" and sessionId ${oldSessionId}, ${status}`)
        return this.updateJob(oldSessionId, this._failures, true, browserName)
    }

    async updateJob (sessionId: string, failures: number, calledOnReload = false, browserName?: string) {
        if (!this._browser) {
            return
        }

        const json = this.getBody(failures, calledOnReload, browserName)
        this._failures = 0
        const response = await got.put(this.getRestUrl(sessionId), {
            json,
            responseType: 'json',
            username: this._tbUser,
            password: this._tbSecret
        })

        return response.body
    }

    /**
     *
     * @param   {String} sessionId Session id
     * @returns {String}           TestingBot API URL
     */
    getRestUrl (sessionId: string) {
        return `https://api.testingbot.com/v1/tests/${sessionId}`
    }

    getBody (failures: number, calledOnReload = false, browserName?: string) {
        const body = { test: {} as any }

        /**
         * set default values
         */
        body.test.name = this._suiteTitle

        /**
         * add reload count to title if reload is used
         */
        if ((calledOnReload || this._testCnt) && this._browser) {
            let testCnt = ++this._testCnt
            if (this._browser.isMultiremote) {
                testCnt = Math.ceil(testCnt / (this._browser as WebdriverIO.MultiRemoteBrowser).instances.length)
            }

            body.test.name += ` (${testCnt})`
        }

        for (const prop of jobDataProperties) {
            if (!(this._capabilities as Record<string, any>)[prop]) {
                continue
            }

            body.test[prop] = (this._capabilities as Record<string, any>)[prop]
        }

        if (browserName) {
            body.test.name = `${browserName}: ${body.test.name}`
        }

        body.test.success = failures === 0 ? '1' : '0'
        return body
    }
}
