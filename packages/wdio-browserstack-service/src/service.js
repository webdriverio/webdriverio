import logger from '@wdio/logger'
import request from 'request'

import { BROWSER_DESCRIPTION } from './constants'

const log = logger('wdio-browserstack-service')

export default class BrowserstackService {
    constructor (config) {
        this.config = config
        this.failures = 0
    }

    before() {
        this.sessionId = global.browser.sessionId
        this.auth = {
            user: this.config.user || 'NotSetUser',
            pass: this.config.key || 'NotSetKey'
        }
        return this._printSessionURL()
    }

    afterSuite(suite) {
        if (suite.hasOwnProperty('error')) {
            this.failures++
        }
    }

    afterTest(test) {
        if (!test.passed) {
            this.failures++
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
        this._printSessionURL()
    }

    _update(sessionId, requestBody) {
        return new Promise((resolve, reject) => {
            request.put(`https://www.browserstack.com/automate/sessions/${sessionId}.json`, {
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
            status: this.failures === 0 ? 'completed' : 'error'
        }
    }

    _printSessionURL() {
        const capabilities = global.browser.capabilities
        return new Promise((resolve,reject) => request.get(
            `https://www.browserstack.com/automate/sessions/${this.sessionId}.json`,
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
