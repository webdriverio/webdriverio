import got from 'got'
import logger from '@wdio/logger'

const log = logger('@wdio/crossbrowsertesting-service')
const jobDataProperties = ['name', 'tags', 'public', 'build', 'extra']

export default class CrossBrowserTestingService implements WebdriverIO.ServiceInstance {
    private _browser!: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject
    private _testCnt = 0;
    private _failures = 0;
    private _isServiceEnabled: boolean;
    private _suiteTitle?: string;
    private _cbtUsername: string;
    private _cbtAuthkey: string;

    constructor(
        private _config: WebdriverIO.Options,
        private _capabilities: WebDriver.DesiredCapabilities
    ) {
        this._cbtUsername = this._config.user as string
        this._cbtAuthkey = this._config.key as string
        this._isServiceEnabled = !!(this._cbtUsername && this._cbtAuthkey)
    }

    before (
        caps: WebDriver.Capabilities,
        specs: string[],
        browser: WebdriverIO.BrowserObject | WebdriverIO.MultiRemoteBrowserObject
    ) {
        this._browser = browser
    }

    /**
     * Before suite
     * @param {Object} suite Suite
    */
    beforeSuite (suite: WebdriverIO.Suite) {
        this._suiteTitle = suite.title
    }

    /**
     * Before test
     * @param {Object} test Test
    */
    beforeTest (test: WebdriverIO.Test) {
        if (!this._isServiceEnabled) {
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
    }

    afterSuite (suite: WebdriverIO.Suite) {
        if (Object.prototype.hasOwnProperty.call(suite, 'error')) {
            ++this._failures
        }
    }

    /**
     * After test
     * @param {Object} test Test
     */
    afterTest (test: WebdriverIO.Test, context: any, results: WebdriverIO.TestResult) {
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
    beforeFeature (uri: string, feature: any) {
        if (!this._isServiceEnabled) {
            return
        }

        this._suiteTitle = feature.document.feature.name
    }
    /**
     * After step
     * @param {string} uri
     * @param {Object} feature
     * @param {Object} pickle
     * @param {Object} result
     */
    afterScenario(uri: string, feature: any, pickle: any, result: any) {
        if (result.status === 'failed') {
            ++this._failures
        }
    }

    /**
     * Update info
     * @return {Promise} Promsie with result of updateJob method call
     */
    after (result?: number) {
        if (!this._isServiceEnabled) {
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
            return this.updateJob(this._browser.sessionId, failures)
        }
        const browser = this._browser
        return Promise.all(Object.keys(this._capabilities).map((browserName) => {
            log.info(`Update multiremote job for browser "${browserName}" and sessionId ${browser[browserName].sessionId}, ${status}`)
            return this.updateJob(browser[browserName].sessionId, failures, false, browserName)
        }))
    }

    onReload (oldSessionId: string, newSessionId: string) {
        if (!this._isServiceEnabled) {
            return
        }
        const status = 'status: ' + (this._failures > 0 ? 'failing' : 'passing')

        if (!this._browser.isMultiremote) {
            log.info(`Update (reloaded) job with sessionId ${oldSessionId}, ${status}`)
            return this.updateJob(oldSessionId, this._failures, true)
        }

        const browserName = this._browser.instances.filter(
            (browserName) => (this._browser as WebdriverIO.MultiRemoteBrowserObject)[browserName].sessionId === newSessionId)[0]
        log.info(`Update (reloaded) multiremote job for browser "${browserName}" and sessionId ${oldSessionId}, ${status}`)
        return this.updateJob(oldSessionId, this._failures, true, browserName)
    }

    async updateJob (sessionId: string, failures: number, calledOnReload = false, browserName?: string) {
        const json = this.getBody(failures, calledOnReload, browserName)
        this._failures = 0
        const response = await got.put(this.getRestUrl(sessionId), {
            json,
            responseType: 'json',
            username: this._cbtUsername,
            password: this._cbtAuthkey
        })
        return response.body
    }

    /**
     *
     * @param {String} sessionId Session id
     * @returns {String}
     */
    getRestUrl (sessionId: string) {
        return `https://crossbrowsertesting.com/api/v3/selenium/${sessionId}`
    }

    getBody (failures: number, calledOnReload = false, browserName?: string) {
        let body = { test: {} as any }

        /**
         * set default values
         */
        body.test['name'] = this._suiteTitle

        /**
         * add reload count to title if reload is used
         */
        if (calledOnReload || this._testCnt) {
            let testCnt = ++this._testCnt
            if (this._browser.isMultiremote) {
                testCnt = Math.ceil(testCnt / this._browser.instances.length)
            }

            body.test['name'] += ` (${testCnt})`
        }

        for (let prop of jobDataProperties) {
            if (!(this._capabilities as Record<string, any>)[prop]) {
                continue
            }

            body.test[prop] = (this._capabilities as Record<string, any>)[prop]
        }

        if (browserName) {
            body.test['name'] = `${browserName}: ${body.test['name']}`
        }

        body.test['success'] = failures === 0 ? '1' : '0'
        return body
    }
}
