import fs from 'node:fs/promises'
import path from 'node:path'

import SauceLabs, { SauceLabsOptions, Job } from 'saucelabs'
import logger from '@wdio/logger'
import type { Services, Capabilities, Options, Frameworks } from '@wdio/types'
import type { Browser, MultiRemoteBrowser } from 'webdriverio'

import { isRDC, ansiRegex } from './utils.js'
import { DEFAULT_OPTIONS } from './constants.js'
import type { SauceServiceConfig } from './types'

const jobDataProperties = ['name', 'tags', 'public', 'build', 'custom-data'] as const

const log = logger('@wdio/sauce-service')

export default class SauceService implements Services.ServiceInstance {
    private _testCnt = 0
    private _maxErrorStackLength = 5
    private _failures = 0 // counts failures between reloads
    private _isServiceEnabled = true
    private _isJobNameSet = false

    private _options: SauceServiceConfig
    private _api: SauceLabs
    private _browser?: Browser<'async'> | MultiRemoteBrowser<'async'>
    private _isRDC?: boolean
    private _suiteTitle?: string
    private _cid = ''

    constructor (
        options: SauceServiceConfig,
        private _capabilities: Capabilities.RemoteCapability,
        private _config: Options.Testrunner
    ) {
        this._options = { ...DEFAULT_OPTIONS, ...options }
        this._api = new SauceLabs(this._config as unknown as SauceLabsOptions)
        this._maxErrorStackLength = this._options.maxErrorStackLength || this._maxErrorStackLength
    }

    /**
     * gather information about runner
     */
    beforeSession (_: never, __: never, ___: never, cid: string) {
        this._cid = cid

        /**
         * if no user and key is specified even though a sauce service was
         * provided set user and key with values so that the session request
         * will fail
         */
        if (!this._config.user) {
            this._isServiceEnabled = false
            this._config.user = 'unknown_user'
        }
        if (!this._config.key) {
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
        this._isRDC = isRDC(capabilities as Capabilities.Capabilities)
    }

    async beforeSuite (suite: Frameworks.Suite) {
        this._suiteTitle = suite.title

        /**
         * Make sure we account for the cases where there is a long running `before` function for a
         * suite or one that can fail so we set the default job name at the suite level
         * Don't do this for Jasmine because the `suiteTitle` is `Jasmine__TopLevel__Suite` and the
         * `fullName` is `null`, so no alternative
         **/
        if (this._browser && !this._isRDC && !this._isJobNameSet && this._suiteTitle !== 'Jasmine__TopLevel__Suite') {
            await this.setAnnotation('sauce:job-name=' + this._suiteTitle)
            this._isJobNameSet = true
        }
    }

    async beforeTest (test: Frameworks.Test) {
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
            this._suiteTitle = test.fullName.slice(0, test.fullName.indexOf(test.description || '') - 1)
        }

        if (this._browser && !this._isJobNameSet) {
            let jobName = this._suiteTitle
            if (this._options.setJobName) {
                jobName = this._options.setJobName(
                    this._config,
                    this._capabilities,
                    this._suiteTitle!
                )
                await this.setAnnotation(`sauce:job-name=${jobName}`)
                this._isJobNameSet = true
            }
            if (!this._isJobNameSet){
                await this.setAnnotation(`sauce:job-name=${jobName}`)
                this._isJobNameSet = true
            }
        }

        /**
         * Date:    20200714
         * Remark:  Sauce Unified Platform doesn't support updating the context yet.
         */
        if (this._isRDC) {
            return
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
        return this.setAnnotation(`sauce:context=${fullTitle}`)
    }

    afterSuite (suite: Frameworks.Suite) {
        if (Object.prototype.hasOwnProperty.call(suite, 'error')) {
            ++this._failures
        }
    }

    private _reportErrorLog (error: Error) {
        const lines = (error.stack || '').split(/\r?\n/).slice(0, this._maxErrorStackLength)
        lines.forEach((line:string) => this.setAnnotation(`sauce:context=${line.replace(ansiRegex(), '')}`))
    }

    afterTest (test: Frameworks.Test, context: unknown, results: Frameworks.TestResult) {
        /**
         * If the test failed push the stack to Sauce Labs in separate lines
         * This should not be done for UP because it's not supported yet and
         * should be removed when UP supports `sauce:context`
         */
        if (results.error && results.error.stack && !this._isRDC){
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

        const isJasminePendingError = typeof results.error === 'string' && results.error.includes('marked Pending')
        if (!results.passed && !isJasminePendingError) {
            ++this._failures
        }
    }

    afterHook (test: never, context: never, results: Frameworks.TestResult) {
        /**
         * If the test failed push the stack to Sauce Labs in separate lines
         * This should not be done for UP because it's not supported yet and
         * should be removed when UP supports `sauce:context`
         */
        if (results.error && !this._isRDC){
            this._reportErrorLog(results.error)
        }

        if (!results.passed) {
            ++this._failures
        }
    }

    /**
     * For CucumberJS
     */
    async beforeFeature (uri: unknown, feature: { name: string }) {
        if (!this._isServiceEnabled || !this._browser) {
            return
        }

        this._suiteTitle = feature.name

        if (this._browser && !this._isJobNameSet) {
            await this.setAnnotation(`sauce:job-name=${this._suiteTitle}`)
            this._isJobNameSet = true
        }

        /**
         * Date:    20200714
         * Remark:  Sauce Unified Platform doesn't support updating the context yet.
         */
        if (this._isRDC) {
            return
        }

        return this.setAnnotation(`sauce:context=Feature: ${this._suiteTitle}`)
    }

    beforeScenario (world: Frameworks.World) {
        /**
         * Date:    20200714
         * Remark:  Sauce Unified Platform doesn't support updating the context yet.
         */
        if (!this._isServiceEnabled || this._isRDC || !this._browser) {
            return
        }

        const scenarioName = world.pickle.name || 'unknown scenario'
        return this.setAnnotation(`sauce:context=-Scenario: ${scenarioName}`)
    }

    async beforeStep (step: Frameworks.PickleStep) {
        /**
         * Remark:  Sauce Unified Platform doesn't support updating the context yet.
         */
        if (!this._isServiceEnabled || this._isRDC || !this._browser) {
            return
        }

        const { keyword, text } = step
        return this.setAnnotation(`sauce:context=--Step: ${keyword}${text}`)
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
     * update Sauce Labs job
     */
    async after (result: number) {
        if (!this._browser || !this._isServiceEnabled) {
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
            return this._isRDC ?
                this.setAnnotation(`sauce:job-result=${failures === 0}`) :
                this.updateJob(this._browser.sessionId, failures)
        }

        const multiRemoteBrowser = this._browser as MultiRemoteBrowser<'async'>
        return Promise.all(Object.keys(this._capabilities).map(async (browserName) => {
            const isMultiRemoteRDC = isRDC(multiRemoteBrowser[browserName].capabilities as Capabilities.Capabilities)
            log.info(`Update multiRemote job for browser "${browserName}" and sessionId ${multiRemoteBrowser[browserName].sessionId}, ${status}`)
            // Sauce Unified Platform (RDC) can not be updated with an API.
            // The logs can also not be uploaded
            if (isMultiRemoteRDC) {
                return this.setAnnotation(`sauce:job-result=${failures === 0}`)
            }
            await this._uploadLogs(multiRemoteBrowser[browserName].sessionId)
            return this.updateJob(multiRemoteBrowser[browserName].sessionId, failures, false, browserName)
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

        const files = (await fs.readdir(this._config.outputDir))
            .filter((file) => file.startsWith(`wdio-${this._cid}`) && file.endsWith('.log'))
        log.info(`Uploading WebdriverIO logs (${files.join(', ')}) to Sauce Labs`)

        return this._api.uploadJobAssets(
            jobId,
            { files: files.map((file) => path.join(this._config.outputDir!, file)) }
        ).catch((err) => log.error(`Couldn't upload log files to Sauce Labs: ${err.message}`))
    }

    onReload (oldSessionId: string, newSessionId: string) {
        if (!this._browser || !this._isServiceEnabled) {
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

        if (this._options.setJobName) {
            body.name = this._options.setJobName(
                this._config,
                this._capabilities,
                this._suiteTitle!
            )
        }

        body.passed = failures === 0
        return body
    }

    /**
     * Update the running Sauce Labs Job with an annotation
     */
    async setAnnotation (annotation: string) {
        if (!this._browser) {
            return
        }

        if (this._browser.isMultiremote) {
            const multiRemoteBrowser = this._browser as MultiRemoteBrowser<'async'>

            return Promise.all(Object.keys(this._capabilities).map(async (browserName) => {
                const isMultiRemoteRDC = isRDC(multiRemoteBrowser[browserName].capabilities as Capabilities.Capabilities)
                if ((isMultiRemoteRDC && !annotation.includes('sauce:context')) || !isMultiRemoteRDC) {
                    return (this._browser as Browser<'async'>).execute(annotation)
                }
            }))
        }

        return (this._browser as Browser<'async'>).execute(annotation)
    }
}
