import logger from '@wdio/logger'
import request from 'request'

import { BROWSER_DESCRIPTION } from './constants'

const log = logger('@wdio/browserstack-service')

export default class BrowserstackService {
    constructor (config) {
        this.config = config
        this.failures = 0
        this.sessionBaseUrl = 'https://api.browserstack.com/automate/sessions'
    }

    /**
     * if no user and key is specified even though a sauce service was
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
        this.auth = {
            user: this.config.user,
            pass: this.config.key
        }
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
        this.fullTitle = test.parent + ' - ' + test.title

        if (!test.passed) {
            this.failures++
            this.failReason = (test.error && test.error.message ? test.error.message : 'Unknown Error')
        }
    }

    afterStep(feature) {
        if (
            /**
             * Cucumber v1
             */
            feature.failureException ||
            /**
             * Cucumber v2
             */
            (typeof feature.getFailureException === 'function' && feature.getFailureException()) ||
            /**
             * Cucumber v3, v4
             */
            (feature.status === 'failed')
        ) {
            ++this.failures
        }
    }

    after() {
        return this._update(this.sessionId, this._getBody())
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
        return new Promise((resolve, reject) => {
            request.put(`${this.sessionBaseUrl}/${sessionId}.json`, {
                json: true,
                auth: this.auth,
                body: requestBody
            }, (error, response, body) => {
                /* istanbul ignore if */
                if (error) {
                    return reject(error)
                }
                return resolve(body)
            })
        })
    }

    _getBody() {
        return {
            status: this.failures === 0 ? 'completed' : 'error',
            name: this.fullTitle,
            reason: this.failReason
        }
    }

    _printSessionURL() {
        const capabilities = global.browser.capabilities
        return new Promise((resolve, reject) => request.get(
            `${this.sessionBaseUrl}/${this.sessionId}.json`,
            {
                json: true,
                auth: this.auth
            },
            (error, response, body) => {
                if (error) {
                    return reject(error)
                }

                if (response.statusCode !== 200) {
                    return reject(new Error(`Bad response code: Expected (200), Received (${response.statusCode})!`))
                }

                // These keys describe the browser the test was run on
                const browserString = BROWSER_DESCRIPTION
                    .map(k => capabilities[k])
                    .filter(v => !!v)
                    .join(' ')

                log.info(`${browserString} session: ${body.automation_session.browser_url}`)
                return resolve(body)
            }
        ))
    }
}
