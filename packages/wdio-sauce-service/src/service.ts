import SauceLabs, { SauceLabsOptions, Job } from 'saucelabs'
import logger from '@wdio/logger'

import { isUnifiedPlatform } from './utils'
import { SauceServiceConfig } from './types'
import WebDriver from 'webdriver'

const jobDataProperties = ['name', 'tags', 'public', 'build', 'custom-data'] as const

const log = logger('@wdio/sauce-service')

export default class SauceService implements WebdriverIO.ServiceInstance {
    private _testCnt = 0
    private _failures = 0 // counts failures between reloads
    private _isServiceEnabled = true

    private _api: SauceLabs
    private _isRDC: boolean
    private _browser?: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject
    private _isUP?: boolean
    private _suiteTitle?: string

    constructor (
        private _options: SauceServiceConfig,
        private _capabilities: WebDriver.Capabilities | WebDriver.DesiredCapabilities,
        private _config: WebdriverIO.Config
    ) {
        this._api = new SauceLabs(this._config as unknown as SauceLabsOptions)
        this._isRDC = 'testobject_api_key' in this._capabilities
    }

    /**
     * gather information about runner
     */
    beforeSession () {
        /**
         * if no user and key is specified even though a sauce service was
         * provided set user and key with values so that the session request
         * will fail (not for RDC tho due to other auth mechansim)
         */
        if (!this._isRDC && !this._config.user) {
            this._isServiceEnabled = false
            this._config.user = 'unknown_user'
        }
        if (!this._isRDC && !this._config.key) {
            this._isServiceEnabled = false
            this._config.key = 'unknown_key'
        }
    }

    before (caps: WebDriver.Capabilities, specs: string[], browser: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject) {
        this._browser = browser

        // Ensure capabilities are not null in case of multiremote
        // Changed from `this._browser.capabilities` to this to get the correct
        // capabilities for EMUSIM (with the postfix) to determine ff the string
        // contains `simulator` or `emulator` it's an EMU/SIM session
        // `this._browser.capabilities` returns the process data from Sauce which is without
        // the postfix
        const capabilities = (this._browser as WebdriverIO.Browser).requestedCapabilities || {}
        this._isUP = isUnifiedPlatform(capabilities)
    }

    beforeSuite (suite: any) {
        this._suiteTitle = suite.title
        if (this._browser && this._options.setJobNameInBeforeSuite && !this._isUP) {
            this._browser.execute('sauce:job-name=' + this._suiteTitle)
        }
    }

    beforeTest (test: any) {
        /**
         * Date:    20200714
         * Remark:  Sauce Unified Platform doesn't support updating the context yet.
         */
        if (!this._isServiceEnabled || this._isRDC || this._isUP || !this._browser) {
            return
        }

        /**
         * in jasmine we get Jasmine__TopLevel__Suite as title since service using test
         * framework hooks in order to execute async functions.
         * This tweak allows us to set the real suite name for jasmine jobs.
         */
        /* istanbul ignore if */
        if (this._suiteTitle === 'Jasmine__TopLevel__Suite') {
            this._suiteTitle = test.fullName.slice(0, test.fullName.indexOf(test.description) - 1)
        }

        const fullTitle = (
            /**
             * Jasmine
             */
            test.fullName ||
            /**
             * Mocha
             */
            `${test.parent} - ${test.title}`
        )
        this._browser.execute('sauce:context=' + fullTitle)
    }

    afterSuite (suite: any) {
        if (Object.prototype.hasOwnProperty.call(suite, 'error')) {
            ++this._failures
        }
    }

    afterTest (test: any, context: any, results: any) {
        /**
         * remove failure if test was retried and passed
         * > Mocha only
         */
        if (test._retriedTest && results.passed) {
            --this._failures
            return
        }

        /**
         * don't bump failure number if test was retried and still failed
         * > Mocha only
         */
        if (test._retriedTest && !results.passed && test._currentRetry < test._retries) {
            return
        }

        if (!results.passed) {
            ++this._failures
        }
    }

    /**
     * For CucumberJS
     */
    beforeFeature (uri: any, feature: any) {
        /**
         * Date:    20200714
         * Remark:  Sauce Unified Platform doesn't support updating the context yet.
         */
        if (!this._isServiceEnabled || this._isRDC || this._isUP || !this._browser) {
            return
        }

        this._suiteTitle = feature.document.feature.name
        this._browser.execute('sauce:context=Feature: ' + this._suiteTitle)
    }

    beforeScenario (uri: any, feature: any, scenario: any) {
        /**
         * Date:    20200714
         * Remark:  Sauce Unified Platform doesn't support updating the context yet.
         */
        if (!this._isServiceEnabled || this._isRDC || this._isUP || !this._browser) {
            return
        }

        const scenarioName = scenario.name
        this._browser.execute('sauce:context=Scenario: ' + scenarioName)
    }

    afterScenario(uri: any, feature: any, pickle: any, result: any) {
        if (result.status === 'failed') {
            ++this._failures
        }
    }

    /**
     * update Sauce Labs job
     */
    after (result: any) {
        if (!this._browser || (!this._isServiceEnabled && !this._isRDC)) {
            return
        }

        let failures = this._failures

        /**
         * set failures if user has bail option set in which case afterTest and
         * afterSuite aren't executed before after hook
         */
        if (this._browser.config.mochaOpts && this._browser.config.mochaOpts.bail && Boolean(result)) {
            failures = 1
        }

        const status = 'status: ' + (failures > 0 ? 'failing' : 'passing')
        if (!this._browser.isMultiremote) {
            log.info(`Update job with sessionId ${this._browser.sessionId}, ${status}`)
            return this._isUP ? this.updateUP(failures) : this.updateJob(this._browser.sessionId, failures)
        }

        const mulitremoteBrowser = this._browser as WebdriverIO.MultiRemoteBrowserObject
        return Promise.all(Object.keys(this._capabilities).map((browserName) => {
            log.info(`Update multiremote job for browser "${browserName}" and sessionId ${mulitremoteBrowser[browserName].sessionId}, ${status}`)
            return this._isUP ? this.updateUP(failures) : this.updateJob(mulitremoteBrowser[browserName].sessionId, failures, false, browserName)
        }))
    }

    onReload (oldSessionId: string, newSessionId: string) {
        if (!this._browser || (!this._isServiceEnabled && !this._isRDC)) {
            return
        }

        const status = 'status: ' + (this._failures > 0 ? 'failing' : 'passing')

        if (!this._browser.isMultiremote) {
            log.info(`Update (reloaded) job with sessionId ${oldSessionId}, ${status}`)
            return this.updateJob(oldSessionId, this._failures, true)
        }

        const mulitremoteBrowser = this._browser as WebdriverIO.MultiRemoteBrowserObject
        const browserName = mulitremoteBrowser.instances.filter(
            (browserName) => mulitremoteBrowser[browserName].sessionId === newSessionId)[0]
        log.info(`Update (reloaded) multiremote job for browser "${browserName}" and sessionId ${oldSessionId}, ${status}`)
        return this.updateJob(oldSessionId, this._failures, true, browserName)
    }

    async updateJob (sessionId: string, failures: number, calledOnReload = false, browserName?: string) {
        if (this._isRDC) {
            await this._api.updateTest(sessionId, { passed: failures === 0 })
            this._failures = 0
            return
        }

        const body = this.getBody(failures, calledOnReload, browserName)
        await this._api.updateJob(this._config.user as string, sessionId, body as Job)
        this._failures = 0
    }

    /**
     * VM message data
     */
    getBody (failures: number, calledOnReload = false, browserName?: string) {
        let body: Partial<Job> = {}

        /**
         * set default values
         */
        body.name = this._suiteTitle

        if (browserName) {
            body.name = `${browserName}: ${body.name}`
        }

        /**
         * add reload count to title if reload is used
         */
        if (calledOnReload || this._testCnt) {
            let testCnt = ++this._testCnt

            const mulitremoteBrowser = this._browser as WebdriverIO.MultiRemoteBrowserObject
            if (this._browser && this._browser.isMultiremote) {
                testCnt = Math.ceil(testCnt / mulitremoteBrowser.instances.length)
            }

            body.name += ` (${testCnt})`
        }

        let caps = this._capabilities['sauce:options'] || this._capabilities as WebDriver.SauceLabsCapabilities

        for (let prop of jobDataProperties) {
            if (!caps[prop]) {
                continue
            }

            body[prop] = caps[prop]
        }

        body.passed = failures === 0
        return body
    }

    /**
     * Update the UP with the JS-executor
     * @param {number} failures
     * @returns {*}
     */
    updateUP (failures: number){
        if (!this._browser) {
            return
        }
        return this._browser.execute(`sauce:job-result=${failures === 0}`)
    }
}
