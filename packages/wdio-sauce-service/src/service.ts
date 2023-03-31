import fs from 'node:fs/promises'
import path from 'node:path'

import ip from 'ip'
import type { SauceLabsOptions, Job } from 'saucelabs'
import SauceLabs from 'saucelabs'
import logger from '@wdio/logger'
import type { Services, Capabilities, Options, Frameworks } from '@wdio/types'

import { isRDC, ansiRegex } from './utils.js'
import { DEFAULT_OPTIONS } from './constants.js'
import type { SauceServiceConfig } from './types.js'

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
    private _browser?: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser
    private _isRDC?: boolean
    private _suiteTitle?: string
    private _cid = ''

    constructor (
        options: SauceServiceConfig,
        private _capabilities: Capabilities.RemoteCapability,
        private _config: Options.Testrunner
    ) {
        this._options = { ...DEFAULT_OPTIONS, ...options }
        // @ts-expect-error https://github.com/saucelabs/node-saucelabs/issues/153
        this._api = new SauceLabs.default(this._config as unknown as SauceLabsOptions)
        this._maxErrorStackLength = this._options.maxErrorStackLength || this._maxErrorStackLength
    }

    /**
     * gather information about runner
     */
    beforeSession (config: Options.Testrunner, __: never, ___: never, cid: string) {
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

        /**
         * update baseUrl if localhost so it can be reached by Sauce Connect
         */
        if (config.baseUrl && config.baseUrl.includes('localhost')) {
            config.baseUrl = config.baseUrl.replace(/(localhost|127\.0\.0\.1)/, ip.address())
        }
    }

    before (caps: unknown, specs: string[], browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser) {
        this._browser = browser

        // Ensure capabilities are not null in case of multiremote
        // Changed from `this._browser.capabilities` to this to get the correct
        // capabilities for EMUSIM (with the postfix) to determine ff the string
        // contains `simulator` or `emulator` it's an EMU/SIM session
        // `this._browser.capabilities` returns the process data from Sauce which is without
        // the postfix
        const capabilities = (this._browser as WebdriverIO.Browser).requestedCapabilities || {}
        this._isRDC = isRDC(capabilities as Capabilities.Capabilities)
    }

    async beforeSuite (suite: Frameworks.Suite) {
        this._suiteTitle = suite.title

        /**
         * Set the default job name at the suite level to make sure we account
         * for the cases where there is a long running `before` function for a
         * suite or one that can fail.
         * Don't do this for Jasmine because `suite.title` is `Jasmine__TopLevel__Suite`
         * and `suite.fullTitle` is `undefined`, so no alternative to use for the job name.
         */
        if (this._browser && !this._isJobNameSet && this._suiteTitle !== 'Jasmine__TopLevel__Suite') {
            await this._setJobName(this._suiteTitle)
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
            await this._setJobName(this._suiteTitle)
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
         */
        if (results.error && results.error.stack){
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
         */
        if (results.error){
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
            await this._setJobName(this._suiteTitle)
        }

        return this.setAnnotation(`sauce:context=Feature: ${this._suiteTitle}`)
    }

    /**
     * Runs before a Cucumber Scenario.
     * @param world world object containing information on pickle and test step
     */
    beforeScenario (world: Frameworks.World) {
        if (!this._isServiceEnabled || !this._browser) {
            return
        }

        const scenarioName = world.pickle.name || 'unknown scenario'
        return this.setAnnotation(`sauce:context=-Scenario: ${scenarioName}`)
    }

    async beforeStep (step: Frameworks.PickleStep) {
        if (!this._isServiceEnabled || !this._browser) {
            return
        }

        const { keyword, text } = step
        return this.setAnnotation(`sauce:context=--Step: ${keyword}${text}`)
    }

    /**
     * Runs after a Cucumber Scenario.
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

        return Promise.all(Object.keys(this._capabilities).map(async (browserName) => {
            const multiRemoteBrowser = (this._browser as WebdriverIO.MultiRemoteBrowser).getInstance(browserName)
            const isMultiRemoteRDC = isRDC(multiRemoteBrowser.capabilities as Capabilities.Capabilities)
            log.info(`Update multiRemote job for browser "${browserName}" and sessionId ${multiRemoteBrowser.sessionId}, ${status}`)
            await this._uploadLogs(multiRemoteBrowser.sessionId)
            // Sauce Unified Platform (RDC) can not be updated with an API.
            if (isMultiRemoteRDC) {
                return this.setAnnotation(`sauce:job-result=${failures === 0}`)
            }
            return this.updateJob(multiRemoteBrowser.sessionId, failures, false, browserName)
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

        const mulitremoteBrowser = this._browser as WebdriverIO.MultiRemoteBrowser
        const browserName = mulitremoteBrowser.instances.filter(
            (browserName: string) => mulitremoteBrowser.getInstance(browserName).sessionId === newSessionId)[0]
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
        const body: Partial<Job> = {}

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

            const mulitremoteBrowser = this._browser as WebdriverIO.MultiRemoteBrowser
            if (this._browser && this._browser.isMultiremote) {
                testCnt = Math.ceil(testCnt / mulitremoteBrowser.instances.length)
            }

            body.name += ` (${testCnt})`
        }

        const caps = (this._capabilities as Capabilities.Capabilities)['sauce:options'] || this._capabilities as Capabilities.SauceLabsCapabilities

        for (const prop of jobDataProperties) {
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
            return Promise.all(Object.keys(this._capabilities).map(async (browserName) => {
                const multiRemoteBrowser = (this._browser as WebdriverIO.MultiRemoteBrowser).getInstance(browserName)
                return multiRemoteBrowser.execute(annotation)
            }))
        }

        return (this._browser as WebdriverIO.Browser).execute(annotation)
    }

    private async _setJobName(suiteTitle: string | undefined) {
        if (!suiteTitle) {
            return
        }
        let jobName = suiteTitle
        if (this._options.setJobName) {
            jobName = this._options.setJobName(
                this._config,
                this._capabilities,
                suiteTitle
            )
        }
        await this.setAnnotation(`sauce:job-name=${jobName}`)
        this._isJobNameSet = true
    }
}
