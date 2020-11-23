import logger from '@wdio/logger'
import got from 'got'

import { getBrowserDescription, getBrowserCapabilities, isBrowserstackCapability } from './util'

const log = logger('@wdio/browserstack-service')

export default class BrowserstackService {
    constructor (options = {}, caps, config, browser) {
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
        this.browser = browser
    }

    /**
     * if no user and key is specified even though a browserstack service was
     * provided set user and key with values so that the session request
     * will fail
     */
    beforeSession (config) {
        if (!config.user) {
            config.user = 'NotSetUser'
        }

        if (!config.key) {
            config.key = 'NotSetKey'
        }
        this.config.user = config.user
        this.config.key = config.key
    }

    before() {
        // Ensure capabilities are not null in case of multiremote
        const capabilities = this.browser.capabilities || {}
        if (capabilities.app || this.caps.app) {
            this.sessionBaseUrl = 'https://api-cloud.browserstack.com/app-automate/sessions'
        }

        this.scenariosThatRan = []

        return this._printSessionURL()
    }

    beforeSuite (suite) {
        this.fullTitle = suite.title
        return this._updateJob({ name: this.fullTitle })
    }

    beforeFeature(uri, feature) {
        this.fullTitle = feature.document.feature.name
        return this._updateJob({ name: this.fullTitle })
    }

    afterTest(test, context, results) {
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

    after(result) {
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

    afterScenario(uri, feature, pickle, results) {
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

    async onReload(oldSessionId, newSessionId) {
        const hasReasons = Boolean(this.failReasons.filter(Boolean).length)

        let status = hasReasons ? 'failed' : 'passed'
        if (!this.browser.isMultiremote) {
            log.info(`Update (reloaded) job with sessionId ${oldSessionId}, ${status}`)
        } else {
            const browserName = this.browser.instances.filter(
                (browserName) => this.browser[browserName].sessionId === newSessionId)[0]
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

    _updateJob(requestBody) {
        return this._multiRemoteAction((sessionId) => this._update(sessionId, requestBody))
    }

    _multiRemoteAction(action) {
        if (!this.browser.isMultiremote) {
            log.info(`Update job with sessionId ${this.browser.sessionId}`)
            return action(this.browser.sessionId)
        }

        return Promise.all(this.browser.instances
            .filter(browserName => {
                const cap = getBrowserCapabilities(this.browser, this.caps, browserName)
                return isBrowserstackCapability(cap)
            })
            .map((browserName) => {
                log.info(`Update multiremote job for browser "${browserName}" and sessionId ${this.browser[browserName].sessionId}`)
                return action(this.browser[browserName].sessionId, browserName)
            }))
    }

    _update(sessionId, requestBody) {
        const sessionUrl = `${this.sessionBaseUrl}/${sessionId}.json`
        log.debug(`Updating Browserstack session at ${sessionUrl} with request body: `, requestBody)
        return got.put(sessionUrl, {
            json: requestBody,
            username: this.config.user,
            password: this.config.key
        })
    }

    async _printSessionURL() {
        await this._multiRemoteAction(async (sessionId, browserName) => {
            const sessionUrl = `${this.sessionBaseUrl}/${sessionId}.json`
            log.debug(`Requesting Browserstack session URL at ${sessionUrl}`)
            const response = await got(sessionUrl, {
                username: this.config.user,
                password: this.config.key,
                responseType: 'json'
            })

            const capabilities = getBrowserCapabilities(this.caps, browserName)
            const browserString = getBrowserDescription(capabilities)
            log.info(`${browserString} session: ${response.body.automation_session.browser_url}`)
        })
    }
}
