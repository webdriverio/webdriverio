import logger from '@wdio/logger'
import got from 'got'

import { BROWSER_DESCRIPTION } from './constants'

const log = logger('@wdio/browserstack-service')

export default class BrowserstackService {
    constructor ({ preferScenarioName = false }, caps, config) {
        this.config = config
        this.sessionBaseUrl = 'https://api.browserstack.com/automate/sessions'
        this.preferScenarioName = Boolean(preferScenarioName)
        this.strict = Boolean(config.cucumberOpts && config.cucumberOpts.strict)
        this.failReasons = []
        this.scenariosThatRan = []
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
        this.sessionId = global.browser.sessionId

        if (global.browser.capabilities.app) {
            this.sessionBaseUrl = 'https://api-cloud.browserstack.com/app-automate/sessions'
        }

        this.scenariosThatRan = []

        return this._printSessionURL()
    }

    beforeFeature(uri, feature) {
        const oldTitle = this.fullTitle
        this.fullTitle = [this.fullTitle, feature.document.feature.name].filter(Boolean).join(', ')
        this.fullTitle !== oldTitle && this._update(this.sessionId, { name: this.fullTitle })
    }

    afterTest(test, context, { error, passed }) {
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
        if(this.preferScenarioName && this.scenariosThatRan.length === 1){
            this.fullTitle = this.scenariosThatRan.pop()
        }

        const hasReasons = Boolean(this.failReasons.filter(Boolean).length)

        return this._update(this.sessionId, {
            status: result === 0 ? 'passed' : 'failed',
            name: this.fullTitle,
            reason: hasReasons ? this.failReasons.join('\n') : undefined
        })
    }

    /**
     * For CucumberJS
     */

    afterScenario(uri, feature, pickle, { exception, status }) {
        if (status !== 'skipped') {
            this.scenariosThatRan.push(pickle.name)
        }

        // See https://github.com/cucumber/cucumber-js/blob/master/src/runtime/index.ts#L136
        const failureStatuses = ['failed', 'ambiguous', 'undefined', 'unknown', this.strict ? ['pending'] : []].flat()

        if (failureStatuses.includes(status)) {
            exception = exception || (status === 'pending'
                ? `Some steps/hooks are pending for scenario "${pickle.name}"`
                : 'Unknown Error')

            this.failReasons.push(exception)
        }
    }

    async onReload(oldSessionId, newSessionId) {
        this.sessionId = newSessionId
        await this._update(oldSessionId, { name: this.fullTitle })
        this.scenariosThatRan = []
        delete this.fullTitle
        this.failReasons = []
        this._printSessionURL()
    }

    _update(sessionId, requestBody) {
        return got.put(`${this.sessionBaseUrl}/${sessionId}.json`, {
            json: requestBody,
            username: this.config.user,
            password: this.config.key
        })
    }

    async _printSessionURL() {
        const capabilities = global.browser.capabilities

        const response = await got(`${this.sessionBaseUrl}/${this.sessionId}.json`, {
            username: this.config.user,
            password: this.config.key,
            responseType: 'json'
        })

        /**
         * These keys describe the browser the test was run on
         */
        const browserString = BROWSER_DESCRIPTION
            .map(k => capabilities[k])
            .filter(v => !!v)
            .join(' ')

        log.info(`${browserString} session: ${response.body.automation_session.browser_url}`)
        return response.body
    }
}
