import logger from '@wdio/logger'
import got from 'got'
import { Browser, Capabilities, Context, Feature, MultiRemoteAction, Pickle, SessionResponse } from './types'

import { getBrowserDescription, getBrowserCapabilities, isBrowserstackCapability } from './util'

const log = logger('@wdio/browserstack-service')

export default class BrowserstackService implements WebdriverIO.ServiceInstance {
    private _sessionBaseUrl: string = 'https://api.browserstack.com/automate/sessions';
    private _failReasons: string[] = [];
    private _scenariosThatRan: string[] = [];
    private _preferScenarioName: boolean;
    private _strict: boolean;
    private _failureStatuses: string[] = ['failed', 'ambiguous', 'undefined', 'unknown'];
    private _caps: Capabilities;
    private _browser?: Browser;
    private _fullTitle?: string;
    constructor (options: BrowserstackConfig = {}, caps: Capabilities, private _config: WebdriverIO.Config) {
        // Cucumber specific
        this._preferScenarioName = Boolean(options.preferScenarioName)
        this._strict = Boolean(_config.cucumberOpts && _config.cucumberOpts.strict)
        // See https://github.com/cucumber/cucumber-js/blob/master/src/runtime/index.ts#L136
        this._strict && this._failureStatuses.push('pending')
        this._caps = caps
    }

    /**
     * if no user and key is specified even though a browserstack service was
     * provided set user and key with values so that the session request
     * will fail
     */
    beforeSession (config: WebdriverIO.Config) {
        if (!config.user) {
            config.user = 'NotSetUser'
        }

        if (!config.key) {
            config.key = 'NotSetKey'
        }
        this._config.user = config.user
        this._config.key = config.key
    }

    before(caps: Capabilities, specs: string[], browser: Browser) {
        this._browser = browser

        // Ensure capabilities are not null in case of multiremote
        const capabilities = this._browser.capabilities || {}
        if (capabilities.app || this._caps.app) {
            this._sessionBaseUrl = 'https://api-cloud.browserstack.com/app-automate/sessions'
        }

        this._scenariosThatRan = []

        return this._printSessionURL()
    }

    beforeSuite (suite: WebdriverIO.Suite) {
        this._fullTitle = suite.title
        return this._updateJob({ name: this._fullTitle })
    }

    beforeFeature(uri: string, feature: Feature) {
        this._fullTitle = feature.document.feature.name
        return this._updateJob({ name: this._fullTitle })
    }

    afterTest(test: WebdriverIO.Test, context: Context, results: WebdriverIO.TestResult) {
        const { error, passed } = results

        this._fullTitle = (
            /**
             * Jasmine
             */
            test.fullName ||
            /**
             * Mocha
             */
            `${test.parent} - ${test.title}`
        )

        if (!passed) {
            this._failReasons.push((error && error.message) || 'Unknown Error')
        }
    }

    after(result: number) {
        // For Cucumber: Checks scenarios that ran (i.e. not skipped) on the session
        // Only 1 Scenario ran and option enabled => Redefine session name to Scenario's name
        if (this._preferScenarioName && this._scenariosThatRan.length === 1){
            this._fullTitle = this._scenariosThatRan.pop()
        }

        const hasReasons = Boolean(this._failReasons.filter(Boolean).length)

        return this._updateJob({
            status: result === 0 ? 'passed' : 'failed',
            name: this._fullTitle,
            reason: hasReasons ? this._failReasons.join('\n') : undefined
        })
    }

    /**
     * For CucumberJS
     */

    afterScenario(uri: string, feature: Feature, pickle: Pickle, results: WebdriverIO.TestResult) {
        let { exception, status } = results

        if (status !== 'skipped') {
            this._scenariosThatRan.push(pickle.name)
        }

        if (this._failureStatuses.includes(status)) {
            exception = exception || (status === 'pending'
                ? `Some steps/hooks are pending for scenario "${pickle.name}"`
                : 'Unknown Error')

            this._failReasons.push(exception)
        }
    }

    async onReload(oldSessionId: string, newSessionId: string) {
        const { _browser } = this
        if (!_browser) {
            return Promise.resolve()
        }

        const hasReasons = Boolean(this._failReasons.filter(Boolean).length)

        let status = hasReasons ? 'failed' : 'passed'
        if (!_browser.isMultiremote) {
            log.info(`Update (reloaded) job with sessionId ${oldSessionId}, ${status}`)
        } else {
            const browserName = _browser.instances.filter(
                (browserName) => _browser[browserName].sessionId === newSessionId)[0]
            log.info(`Update (reloaded) multiremote job for browser "${browserName}" and sessionId ${oldSessionId}, ${status}`)
        }

        await this._update(oldSessionId, {
            name: this._fullTitle,
            status,
            reason: hasReasons ? this._failReasons.join('\n') : undefined
        })
        this._scenariosThatRan = []
        delete this._fullTitle
        this._failReasons = []
        await this._printSessionURL()
    }

    _updateJob(requestBody: any) {
        return this._multiRemoteAction((sessionId, browserName) => {
            log.info(browserName
                ? `Update multiremote job for browser "${browserName}" and sessionId ${sessionId}`
                : `Update job with sessionId ${sessionId}`
            )
            return this._update(sessionId, requestBody)
        })
    }

    _multiRemoteAction(action: MultiRemoteAction) {
        const { _browser } = this
        if (!_browser) {
            return Promise.resolve()
        }

        if (!_browser.isMultiremote) {
            return action(_browser.sessionId)
        }

        return Promise.all(_browser.instances
            .filter(browserName => {
                const cap = getBrowserCapabilities(_browser, this._caps, browserName)
                return isBrowserstackCapability(cap as Capabilities)
            })
            .map((browserName: string) => (
                action(_browser[browserName].sessionId, browserName)
            ))
        )
    }

    _update(sessionId: string, requestBody: any) {
        const sessionUrl = `${this._sessionBaseUrl}/${sessionId}.json`
        log.debug(`Updating Browserstack session at ${sessionUrl} with request body: `, requestBody)
        return got.put(sessionUrl, {
            json: requestBody,
            username: this._config.user,
            password: this._config.key
        })
    }

    async _printSessionURL() {
        const { _browser } = this
        if (!_browser) {
            return Promise.resolve()
        }
        await this._multiRemoteAction(async (sessionId, browserName) => {
            const sessionUrl = `${this._sessionBaseUrl}/${sessionId}.json`
            log.debug(`Requesting Browserstack session URL at ${sessionUrl}`)
            const response = await got<SessionResponse>(sessionUrl, {
                username: this._config.user,
                password: this._config.key,
                responseType: 'json'
            })

            const capabilities = getBrowserCapabilities(_browser, this._caps, browserName)
            const browserString = getBrowserDescription(capabilities as Capabilities)
            log.info(`${browserString} session: ${response.body.automation_session.browser_url}`)
        })
    }
}
