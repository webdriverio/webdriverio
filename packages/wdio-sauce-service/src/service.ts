import SauceLabs, { SauceLabsOptions, Job } from 'saucelabs'
import logger from '@wdio/logger'
import type { Services, Capabilities, Options, Frameworks } from '@wdio/types'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'

import { isUnifiedPlatform } from './utils'
import { SauceServiceConfig } from './types'

const jobDataProperties = ['name', 'tags', 'public', 'build', 'custom-data'] as const

const log = logger('@wdio/sauce-service')

export default class SauceService implements Services.ServiceInstance {
    private _testCnt = 0
    private _failures = 0 // counts failures between reloads
    private _isServiceEnabled = true

    private _api: SauceLabs
    private _isRDC: boolean
    private _browser?: Browser | MultiRemoteBrowser
    private _isUP?: boolean
    private _suiteTitle?: string

    constructor (
        private _options: SauceServiceConfig,
        private _capabilities: Capabilities.RemoteCapability,
        private _config: Options.Testrunner
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

    before (caps: unknown, specs: string[], browser: Browser | MultiRemoteBrowser) {
        this._browser = browser

        // Ensure capabilities are not null in case of multiremote
        // Changed from `this._browser.capabilities` to this to get the correct
        // capabilities for EMUSIM (with the postfix) to determine ff the string
        // contains `simulator` or `emulator` it's an EMU/SIM session
        // `this._browser.capabilities` returns the process data from Sauce which is without
        // the postfix
        const capabilities = (this._browser as Browser).requestedCapabilities || {}
        this._isUP = isUnifiedPlatform(capabilities as Capabilities.Capabilities)
    }

    beforeSuite (suite: Frameworks.Suite) {
        this._suiteTitle = suite.title
        if (this._browser && this._options.setJobNameInBeforeSuite && !this._isUP) {
            (this._browser as Browser).execute('sauce:job-name=' + this._suiteTitle)
        }
    }

    beforeTest (test: Frameworks.Test) {
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
            this._suiteTitle = test.fullName.slice(0, test.fullName.indexOf(test.description || '') - 1)
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
        ;(this._browser as Browser).execute('sauce:context=' + fullTitle)
    }

    afterSuite (suite: Frameworks.Suite) {
        if (Object.prototype.hasOwnProperty.call(suite, 'error')) {
            ++this._failures
        }
    }

    afterTest (test: Frameworks.Test, context: unknown, results: Frameworks.TestResult) {
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
        if (
            test._retriedTest &&
            !results.passed &&
            (
                typeof test._currentRetry === 'number' &&
                typeof test._retries === 'number' &&
                test._currentRetry < test._retries
            )
        ) {
            return
        }

        if (!results.passed) {
            ++this._failures
        }
    }

    /**
     * For CucumberJS
     */
    beforeFeature (uri: unknown, feature: { name: string }) {
        /**
         * Date:    20200714
         * Remark:  Sauce Unified Platform doesn't support updating the context yet.
         */
        if (!this._isServiceEnabled || this._isRDC || this._isUP || !this._browser) {
            return
        }

        this._suiteTitle = feature.name
        ;(this._browser as Browser).execute('sauce:context=Feature: ' + this._suiteTitle)
    }

    beforeScenario (world: Frameworks.World) {
        /**
         * Date:    20200714
         * Remark:  Sauce Unified Platform doesn't support updating the context yet.
         */
        if (!this._isServiceEnabled || this._isRDC || this._isUP || !this._browser) {
            return
        }

        const scenarioName = world.pickle.name || 'unknown scenario'
        ;(this._browser as Browser).execute('sauce:context=Scenario: ' + scenarioName)
    }

    afterScenario(world: Frameworks.World) {
        // check if scenario has failed
        if (world.result && world.result.status === 6) {
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
        if (this._config.mochaOpts && this._config.mochaOpts.bail && Boolean(result)) {
            failures = 1
        }

        const status = 'status: ' + (failures > 0 ? 'failing' : 'passing')
        if (!this._browser.isMultiremote) {
            log.info(`Update job with sessionId ${this._browser.sessionId}, ${status}`)
            return this._isUP ? this.updateUP(failures) : this.updateJob(this._browser.sessionId, failures)
        }

        const mulitremoteBrowser = this._browser as MultiRemoteBrowser
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

        const mulitremoteBrowser = this._browser as MultiRemoteBrowser
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

            const mulitremoteBrowser = this._browser as MultiRemoteBrowser
            if (this._browser && this._browser.isMultiremote) {
                testCnt = Math.ceil(testCnt / mulitremoteBrowser.instances.length)
            }

            body.name += ` (${testCnt})`
        }

        let caps = (this._capabilities as Capabilities.Capabilities)['sauce:options'] || this._capabilities as Capabilities.SauceLabsCapabilities

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
        return (this._browser as Browser).execute(`sauce:job-result=${failures === 0}`)
    }
}
