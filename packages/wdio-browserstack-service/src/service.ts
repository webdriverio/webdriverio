import logger from '@wdio/logger'
import got, { GotRequestFunction } from 'got'
import WebDriver from 'webdriver'

import { getBrowserDescription, getBrowserCapabilities, isBrowserstackCapability } from './util'

const log = logger('@wdio/browserstack-service')

type Capabilities = WebDriver.Capabilities & WebdriverIO.MultiRemoteCapabilities;

type Browser = WebdriverIO.BrowserObject & WebdriverIO.MultiRemoteBrowserObject;

type Config = WebdriverIO.Config & { cucumberOpts?: { strict: boolean } };

type Suite = {
    title: string;
}

type Test = {
    fullName: string,
    parent: string,
    title: string
};

type Context = any;

type Specs = any;

type Feature = {
    document: {
        feature: {
            name: string;
        }
    }
};

type Results = {
    error: Error;
    passed: boolean
    exception: any;
    status: string;
};

type Pickle = {
    name: string;
}

type MultiRemoteAction = (sessionId: string, browserName?: string) => ReturnType<GotRequestFunction> | Promise<void>;

type SessionResponse = {
    // eslint-disable-next-line camelcase
    automation_session: {
        // eslint-disable-next-line camelcase
        browser_url: string
    }
}

export default class BrowserstackService {
    config: Config;
    sessionBaseUrl: string;
    failReasons: string[];
    scenariosThatRan: string[];
    preferScenarioName: boolean;
    strict: boolean;
    failureStatuses: string[];
    caps: Capabilities;
    browser?: Browser;
    fullTitle?: string;
    constructor (options: BrowserstackConfig = {}, caps: Capabilities, config: Config) {
        this.config = config
        this.sessionBaseUrl = 'https://api.browserstack.com/automate/sessions'
        this.failReasons = []

        // Cucumber specific
        this.scenariosThatRan = []
        this.preferScenarioName = Boolean(options.preferScenarioName)
        this.strict = Boolean(config.cucumberOpts && config.cucumberOpts.strict)
        // See https://github.com/cucumber/cucumber-js/blob/master/src/runtime/index.ts#L136
        this.failureStatuses = ['failed', 'ambiguous', 'undefined', 'unknown']
        this.strict && this.failureStatuses.push('pending')
        this.caps = caps
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
        this.config.user = config.user
        this.config.key = config.key
    }

    before(caps: Capabilities, specs: Specs, browser: Browser) {
        this.browser = browser

        // Ensure capabilities are not null in case of multiremote
        const capabilities = this.browser.capabilities || {}
        if (capabilities.app || this.caps.app) {
            this.sessionBaseUrl = 'https://api-cloud.browserstack.com/app-automate/sessions'
        }

        this.scenariosThatRan = []

        return this._printSessionURL()
    }

    beforeSuite (suite: Suite) {
        this.fullTitle = suite.title
        return this._updateJob({ name: this.fullTitle })
    }

    beforeFeature(uri: string, feature: Feature) {
        this.fullTitle = feature.document.feature.name
        return this._updateJob({ name: this.fullTitle })
    }

    afterTest(test: Test, context: Context, results: Results) {
        const { error, passed } = results

        this.fullTitle = (
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
            this.failReasons.push((error && error.message) || 'Unknown Error')
        }
    }

    after(result: number) {
        // For Cucumber: Checks scenarios that ran (i.e. not skipped) on the session
        // Only 1 Scenario ran and option enabled => Redefine session name to Scenario's name
        if (this.preferScenarioName && this.scenariosThatRan.length === 1){
            this.fullTitle = this.scenariosThatRan.pop()
        }

        const hasReasons = Boolean(this.failReasons.filter(Boolean).length)

        return this._updateJob({
            status: result === 0 ? 'passed' : 'failed',
            name: this.fullTitle,
            reason: hasReasons ? this.failReasons.join('\n') : undefined
        })
    }

    /**
     * For CucumberJS
     */

    afterScenario(uri: string, feature: Feature, pickle: Pickle, results: Results) {
        let { exception, status } = results

        if (status !== 'skipped') {
            this.scenariosThatRan.push(pickle.name)
        }

        if (this.failureStatuses.includes(status)) {
            exception = exception || (status === 'pending'
                ? `Some steps/hooks are pending for scenario "${pickle.name}"`
                : 'Unknown Error')

            this.failReasons.push(exception)
        }
    }

    async onReload(oldSessionId: string, newSessionId: string) {
        const { browser } = this
        if (!browser) {
            return Promise.resolve()
        }

        const hasReasons = Boolean(this.failReasons.filter(Boolean).length)

        let status = hasReasons ? 'failed' : 'passed'
        if (!browser.isMultiremote) {
            log.info(`Update (reloaded) job with sessionId ${oldSessionId}, ${status}`)
        } else {
            const browserName = browser.instances.filter(
                (browserName) => browser[browserName].sessionId === newSessionId)[0]
            log.info(`Update (reloaded) multiremote job for browser "${browserName}" and sessionId ${oldSessionId}, ${status}`)
        }

        await this._update(oldSessionId, {
            name: this.fullTitle,
            status,
            reason: hasReasons ? this.failReasons.join('\n') : undefined
        })
        this.scenariosThatRan = []
        delete this.fullTitle
        this.failReasons = []
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
        const { browser } = this
        if (!browser) {
            return Promise.resolve()
        }

        if (!browser.isMultiremote) {
            return action(browser.sessionId)
        }

        return Promise.all(browser.instances
            .filter(browserName => {
                const cap = getBrowserCapabilities(browser, this.caps, browserName)
                return isBrowserstackCapability(cap as Capabilities)
            })
            .map((browserName: string) => (
                action(browser[browserName].sessionId, browserName)
            ))
        )
    }

    _update(sessionId: string, requestBody: any) {
        const sessionUrl = `${this.sessionBaseUrl}/${sessionId}.json`
        log.debug(`Updating Browserstack session at ${sessionUrl} with request body: `, requestBody)
        return got.put(sessionUrl, {
            json: requestBody,
            username: this.config.user,
            password: this.config.key
        })
    }

    async _printSessionURL() {
        const { browser } = this
        if (!browser) {
            return Promise.resolve()
        }
        await this._multiRemoteAction(async (sessionId, browserName) => {
            const sessionUrl = `${this.sessionBaseUrl}/${sessionId}.json`
            log.debug(`Requesting Browserstack session URL at ${sessionUrl}`)
            const response = await got<SessionResponse>(sessionUrl, {
                username: this.config.user,
                password: this.config.key,
                responseType: 'json'
            })

            const capabilities = getBrowserCapabilities(browser, this.caps, browserName)
            const browserString = getBrowserDescription(capabilities as Capabilities)
            log.info(`${browserString} session: ${response.body.automation_session.browser_url}`)
        })
    }
}
