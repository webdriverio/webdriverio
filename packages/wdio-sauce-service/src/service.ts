import fs from 'fs'
import path from 'path'

import SauceLabs, { SauceLabsOptions, Job } from 'saucelabs'
import logger from '@wdio/logger'
import type { Services, Capabilities, Options, Frameworks } from '@wdio/types'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'

import { isUnifiedPlatform, ansiRegex } from './utils'
import { SauceServiceConfig } from './types'
import { DEFAULT_OPTIONS } from './constants'

const jobDataProperties = ['name', 'tags', 'public', 'build', 'custom-data'] as const

const log = logger('@wdio/sauce-service')

export default class SauceService implements Services.ServiceInstance {
    private _testCnt = 0
    private _maxErrorStackLength = 5
    private _failures = 0 // counts failures between reloads
    private _isServiceEnabled = true
    private _isJobNameSet = false;

    private _options: SauceServiceConfig
    private _api: SauceLabs
    private _isRDC: boolean
    private _browser?: Browser<'async'> | MultiRemoteBrowser<'async'>
    private _isUP?: boolean
    private _suiteTitle?: string

    constructor (
        options: SauceServiceConfig,
        private _capabilities: Capabilities.RemoteCapability,
        private _config: Options.Testrunner
    ) {
        this._options = { ...DEFAULT_OPTIONS, ...options }
        this._api = new SauceLabs(this._config as unknown as SauceLabsOptions)
        this._isRDC = 'testobject_api_key' in this._capabilities
        this._maxErrorStackLength = this._options.maxErrorStackLength || this._maxErrorStackLength
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

    before (caps: unknown, specs: string[], browser: Browser<'async'> | MultiRemoteBrowser<'async'>) {
        this._browser = browser

        // Ensure capabilities are not null in case of multiremote
        // Changed from `this._browser.capabilities` to this to get the correct
        // capabilities for EMUSIM (with the postfix) to determine ff the string
        // contains `simulator` or `emulator` it's an EMU/SIM session
        // `this._browser.capabilities` returns the process data from Sauce which is without
        // the postfix
        const capabilities = (this._browser as Browser<'async'>).requestedCapabilities || {}
        this._isUP = isUnifiedPlatform(capabilities as Capabilities.Capabilities)
    }

    beforeSuite (suite: Frameworks.Suite) {
        this._suiteTitle = suite.title
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

        if (this._browser && !this._isUP && !this._isJobNameSet) {
            this._browser.execute('sauce:job-name=' + this._suiteTitle)
            this._isJobNameSet = true
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
        ;(this._browser as Browser<'async'>).execute('sauce:context=' + fullTitle)
    }

    afterSuite (suite: Frameworks.Suite) {
        if (Object.prototype.hasOwnProperty.call(suite, 'error')) {
            ++this._failures
        }
    }

    private _reportErrorLog (error: Error) {
        const lines = (error.stack || '').split(/\r?\n/).slice(0, this._maxErrorStackLength)
        lines.forEach((line:string) => this._browser!.execute(`sauce:context=${line.replace(ansiRegex(), '')}`))
    }

    afterTest (test: Frameworks.Test, context: unknown, results: Frameworks.TestResult) {
        /**
         * If the test failed push the stack to Sauce Labs in separate lines
         * This should not be done for UP because it's not supported yet and
         * should be removed when UP supports `sauce:context`
         */
        if (results.error && !this._isUP){
            this._reportErrorLog(results.error)
        }

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

    afterHook (test: never, context: never, results: Frameworks.TestResult) {
        /**
         * If the test failed push the stack to Sauce Labs in separate lines
         * This should not be done for UP because it's not supported yet and
         * should be removed when UP supports `sauce:context`
         */
        if (results.error && !this._isUP){
            this._reportErrorLog(results.error)
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

        if (this._browser && !this._isUP && !this._isJobNameSet) {
            this._browser.execute('sauce:job-name=' + this._suiteTitle)
            this._isJobNameSet = true
        }

        (this._browser as Browser<'async'>).execute('sauce:context=Feature: ' + this._suiteTitle)
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
        ;(this._browser as Browser<'async'>).execute('sauce:context=Scenario: ' + scenarioName)
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
    async after (result: number) {
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
            await this._uploadLogs(this._browser.sessionId)
            log.info(`Update job with sessionId ${this._browser.sessionId}, ${status}`)
            return this._isUP ? this.updateUP(failures) : this.updateJob(this._browser.sessionId, failures)
        }

        const mulitremoteBrowser = this._browser as MultiRemoteBrowser<'async'>
        return Promise.all(Object.keys(this._capabilities).map(async (browserName) => {
            await this._uploadLogs(mulitremoteBrowser[browserName].sessionId)
            log.info(`Update multiremote job for browser "${browserName}" and sessionId ${mulitremoteBrowser[browserName].sessionId}, ${status}`)
            return this._isUP ? this.updateUP(failures) : this.updateJob(mulitremoteBrowser[browserName].sessionId, failures, false, browserName)
        }))
    }

    /**
     * upload files to Sauce Labs platform
     * @param jobId id of the job
     * @returns a promise that is resolved once all files got uploaded
     */
    private async _uploadLogs (jobId: string) {
        if (!this._options.uploadLogs || !this._config.outputDir) {
            return
        }

        const files = (await fs.promises.readdir(this._config.outputDir))
            .filter((file) => file.endsWith('.log'))
        log.info(`Uploading WebdriverIO logs (${files.join(', ')}) to Sauce Labs`)

        return this._api.uploadJobAssets(
            jobId,
            { files: files.map((file) => path.join(this._config.outputDir!, file)) }
        ).catch((err) => log.error(`Couldn't upload log files to Sauce Labs: ${err.message}`))
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

        const mulitremoteBrowser = this._browser as MultiRemoteBrowser<'async'>
        const browserName = mulitremoteBrowser.instances.filter(
            (browserName: string) => mulitremoteBrowser[browserName].sessionId === newSessionId)[0]
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
         * add reload count to title if reload is used
         */
        if (calledOnReload || this._testCnt) {
            /**
             * set default values
             */
            body.name = this._suiteTitle

            if (browserName) {
                body.name = `${browserName}: ${body.name}`
            }

            let testCnt = ++this._testCnt

            const mulitremoteBrowser = this._browser as MultiRemoteBrowser<'async'>
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
        return this._browser.execute(`sauce:job-result=${failures === 0}`)
    }
}
