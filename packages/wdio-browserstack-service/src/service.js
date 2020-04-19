import logger from '@wdio/logger'
import got from 'got'

import { BROWSER_DESCRIPTION } from './constants'

const log = logger('@wdio/browserstack-service')

export default class BrowserstackService {
    constructor (options, caps, config) {
        this.caps = caps
        this.config = config
        this.failures = 0
        this.sessionBaseUrl = 'https://api.browserstack.com/automate/sessions'
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

        return this._printSessionURL()
    }

    afterSuite(suite) {
        if (Object.prototype.hasOwnProperty.call(suite, 'error')) {
            this.failures++
        }
    }

    afterTest(test) {
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

        if (!test.passed) {
            this.failures++
            this.failReason = (test.error && test.error.message ? test.error.message : 'Unknown Error')
        }
    }

    after() {
        return this._update(this.sessionId, this._getBody())
    }

    /**
     * For CucumberJS
     */

    afterScenario(uri, feature, pickle, result) {
        if (result.status === 'failed') {
            ++this.failures
        }
    }

    async onReload(oldSessionId, newSessionId) {
        this.sessionId = newSessionId
        await this._update(oldSessionId, this._getBody())
        this.failures = 0
        delete this.fullTitle
        delete this.failReason
        this._printSessionURL()
    }

    _update(sessionId, requestBody) {
        return got.put(`${this.sessionBaseUrl}/${sessionId}.json`, {
            json: requestBody,
            username: this.config.user,
            password: this.config.key
        })
    }

    _getBody() {
        return {
            status: this.failures === 0 ? 'passed' : 'failed',
            name: this.caps.name !== undefined ? this.caps.name : this.fullTitle,
            reason: this.failReason
        }
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
