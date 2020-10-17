import SauceLabs, { Job, SauceConnectOptions, SauceLabsOptions } from 'saucelabs'
import logger from '@wdio/logger'
import { isUnifiedPlatform } from './utils'
import WDIOReporter from '@wdio/reporter'
import { DesiredCapabilities } from 'webdriver'
import { BrowserObject, HookFunctions, Suite } from 'webdriverio'
import { CucumberHookFunctions, CucumberHookObject, CucumberHookResult } from '@wdio/cucumber-framework'
import { ScenarioResult } from 'cucumber'

const jobDataProperties = ['name', 'tags', 'public', 'build', 'custom-data']

const log = logger('@wdio/sauce-service')

declare global {
    namespace NodeJS {
        interface Global {
            browser: WebdriverIO.BrowserObject;
        }
    }
}

declare module 'webdriverio' {
    export interface Test extends Suite {
        // Jasmine only
        description?: string
        // Mocha only
        retriedTest?: any
        retries: number
        currentRetry: number
    }
}

export interface SauceServiceConfig {
    /**
     * If true it runs Sauce Connect and opens a secure connection between a Sauce Labs virtual
     * machine running your browser tests.
     */
    sauceConnect?: boolean;
    /**
     * Apply Sauce Connect options (e.g. to change port number or logFile settings). See this
     * list for more information: https://github.com/bermi/sauce-connect-launcher#advanced-usage
     */
    sauceConnectOpts?: SauceConnectOptions;
    /**
     * Use Sauce Connect as a Selenium Relay. See more [here](https://wiki.saucelabs.com/display/DOCS/Using+the+Selenium+Relay+with+Sauce+Connect+Proxy).
     * @deprecated
     */
    scRelay?: boolean;
    /**
     * If true it updates the job name at the Sauce Labs job in the beforeSuite Hook.
     * Attention: this comes at the cost of an additional call to Sauce Labs
     * Default: false
     */
    setJobNameInBeforeSuite?: boolean;
}

export type SauceConfig = SauceLabsOptions & WebdriverIO.Config;

interface MultiRemoteBrowser extends WebdriverIO.BrowserObject {
    instances: string[]
    isMultiremote: boolean
}

export default class SauceService implements HookFunctions, CucumberHookFunctions {
    testCnt: number;
    failures: number;
    options: SauceServiceConfig;
    config?: SauceConfig;
    capabilities?: DesiredCapabilities;
    api?: SauceLabs;
    isRDC?: boolean;
    isServiceEnabled?: boolean;
    isUP?: boolean;
    suiteTitle?: string;

    constructor (options?: SauceServiceConfig) {
        this.testCnt = 0
        this.failures = 0 // counts failures between reloads
        this.options = options || {}
    }

    /**
     * gather information about runner
     */
    beforeSession (config: SauceConfig, capabilities: DesiredCapabilities): void {
        this.config = config
        this.capabilities = capabilities
        this.api = new SauceLabs(this.config)
        this.isRDC = 'testobject_api_key' in this.capabilities
        this.isServiceEnabled = true

        /**
         * if no user and key is specified even though a sauce service was
         * provided set user and key with values so that the session request
         * will fail (not for RDC tho due to other auth mechansim)
         */
        if (!this.isRDC && !config.user) {
            this.isServiceEnabled = false
            config.user = 'unknown_user'
        }
        if (!this.isRDC && !config.key) {
            this.isServiceEnabled = false
            config.key = 'unknown_key'
        }
    }

    before(): void {
        // Ensure capabilities are not null in case of multiremote
        const capabilities = global.browser.capabilities || {}
        this.isUP = isUnifiedPlatform(capabilities)
    }

    beforeSuite (suite: WebdriverIO.Suite): void {
        this.suiteTitle = suite.title
        if (this.options.setJobNameInBeforeSuite && !this.isUP) {
            global.browser.execute('sauce:job-name=' + this.suiteTitle)
        }
    }

    beforeTest (test: WebdriverIO.Test & WDIOReporter.Suite): void {
        /**
         * Date:    20200714
         * Remark:  Sauce Unified Platform doesn't support updating the context yet.
         */
        if (!this.isServiceEnabled || this.isRDC || this.isUP) {
            return
        }

        /**
         * in jasmine we get Jasmine__TopLevel__Suite as title since service using test
         * framework hooks in order to execute async functions.
         * This tweak allows us to set the real suite name for jasmine jobs.
         */
        /* istanbul ignore if */
        if (this.suiteTitle === 'Jasmine__TopLevel__Suite' && test.description) {
            this.suiteTitle = test.fullName.slice(0, test.fullName.indexOf(test.description) - 1)
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
        global.browser.execute('sauce:context=' + fullTitle)
    }

    afterSuite (suite: WebdriverIO.Suite): void {
        if (Object.prototype.hasOwnProperty.call(suite, 'error')) {
            ++this.failures
        }
    }

    afterTest (test: WebdriverIO.Test, context: any, result: WebdriverIO.TestResult): void {
        /**
         * remove failure if test was retried and passed
         * > Mocha only
         */
        if (test.retriedTest && result.passed) {
            --this.failures
            return
        }

        /**
         * don't bump failure number if test was retried and still failed
         * > Mocha only
         */
        if (test.retriedTest && !result.passed && test.currentRetry < test.retries) {
            return
        }

        if (!result.passed) {
            ++this.failures
        }
    }

    /**
     * For CucumberJS
     */
    beforeFeature (uri: string, feature: CucumberHookObject): void {
        /**
         * Date:    20200714
         * Remark:  Sauce Unified Platform doesn't support updating the context yet.
         */
        if (!this.isServiceEnabled || this.isRDC || this.isUP) {
            return
        }

        this.suiteTitle = feature.document.feature.name
        global.browser.execute('sauce:context=Feature: ' + this.suiteTitle)
    }

    beforeScenario (uri: string, feature: CucumberHookObject, scenario: CucumberHookObject): void {
        /**
         * Date:    20200714
         * Remark:  Sauce Unified Platform doesn't support updating the context yet.
         */
        if (!this.isServiceEnabled || this.isRDC || this.isUP) {
            return
        }

        const scenarioName = scenario.name
        global.browser.execute('sauce:context=Scenario: ' + scenarioName)
    }
    afterScenario(uri: string, feature: CucumberHookObject, scenario: CucumberHookObject, result: CucumberHookResult | ScenarioResult): void {
        if (result.status === 'failed') {
            ++this.failures
        }
    }

    /**
     * update Sauce Labs job
     */
    after (result?: number) {
        if (!this.isServiceEnabled && !this.isRDC) {
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
        if (!this.multiRemoteBrowser.isMultiremote) {
            log.info(`Update job with sessionId ${global.browser.sessionId}, ${status}`)
            return this.isUP ? this.updateUP(failures) : this.updateJob(global.browser.sessionId, failures)
        }

        if (this.capabilities) {
            return Promise.all(Object.keys(this.capabilities).map((browserName) => {
                const browser = global.browser[browserName as keyof BrowserObject] as BrowserObject
                log.info(`Update multiremote job for browser "${browserName}" and sessionId ${browser.sessionId}, ${status}`)
                return this.isUP ? this.updateUP(failures) : this.updateJob(browser.sessionId, failures, false, browserName)
            }))
        }
    }

    onReload (oldSessionId: string, newSessionId: string) {
        if (!this.isServiceEnabled && !this.isRDC) {
            return
        }

        const status = 'status: ' + (this.failures > 0 ? 'failing' : 'passing')

        if (!this.multiRemoteBrowser.isMultiremote) {
            log.info(`Update (reloaded) job with sessionId ${oldSessionId}, ${status}`)
            return this.updateJob(oldSessionId, this.failures, true)
        }

        const browserName = this.multiRemoteBrowser.instances.filter(
            (browserName: string) => (global.browser[browserName as keyof BrowserObject] as BrowserObject).sessionId === newSessionId)[0]
        log.info(`Update (reloaded) multiremote job for browser "${browserName}" and sessionId ${oldSessionId}, ${status}`)
        return this.updateJob(oldSessionId, this.failures, true, browserName)
    }

    async updateJob (sessionId: string, failures: number, calledOnReload = false, browserName?: string) {
        if (!this.api) {
            return
        }

        if (this.isRDC) {
            await this.api.updateTest(sessionId, { passed: failures === 0 })
            this.failures = 0
            return
        }

        const body = this.getBody(failures, calledOnReload, browserName)
        if (this.config) {
            await this.api.updateJob(this.config.user, sessionId, body as Job)
        }
        this.failures = 0
    }

    /**
     * VM message data
     */
    getBody (failures: number, calledOnReload = false, browserName?: string): Partial<Job> {
        let body: Partial<Job> = {}

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

            if (this.multiRemoteBrowser.isMultiremote) {
                testCnt = Math.ceil(testCnt / this.multiRemoteBrowser.instances.length)
            }

            body.name += ` (${testCnt})`
        }

        let caps = (this.capabilities && this.capabilities['sauce:options']) || this.capabilities

        for (const prop of jobDataProperties) {
            const capProp = prop as keyof typeof caps
            if (!caps?.[capProp]) {
                continue
            }
            body[capProp] = caps[capProp]
        }

        body.passed = failures === 0
        return body
    }

    /**
     * Update the UP with the JS-executor
     * @param {number} failures
     * @returns {*}
     */
    updateUP(failures: number){
        return global.browser.execute(`sauce:job-result=${failures === 0}`)
    }

    private get multiRemoteBrowser(): MultiRemoteBrowser {
        return global.browser as MultiRemoteBrowser
    }
}