import logger from '@wdio/logger'
import request from 'request'

const log = logger('wdio-browserstack-service');

export default class BrowserstackService {
    constructor (config) {
        this.config = config
    }

    before() {
        this.sessionId = global.browser.sessionId;
        this.failures = 0;
        this.auth = global.browser.requestHandler ? global.browser.requestHandler.auth || {} : {};
        return this._printSessionURL();
    }

    afterSuite(suite) {
        if (suite.hasOwnProperty('error')) {
            this.failures++;
        }
    }

    afterTest(test) {
        if (!test.passed) {
            this.failures++;
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
        return this._update(this.sessionId, this._getBody());
    }

    onReload(oldSessionId, newSessionId) {
        this.sessionId = newSessionId;
        return this._update(oldSessionId, this._getBody())
            .then(() => {
                this.failures = 0;
            })
            .then(() => this._printSessionURL())
    }

    _update(sessionId, requestBody) {
        return new Promise((resolve, reject) => {
            request.put(`https://www.browserstack.com/automate/sessions/${sessionId}.json`, {
                json: true,
                auth: {
                    user: this.auth.user,
                    pass: this.auth.pass
                },
                body: requestBody
            }, (error, response, body) => {
                /* istanbul ignore if */
                if (error) {
                    return reject(error)
                }
                return resolve(body)
            })
        });
    }

    _getBody() {
        return {
            status: this.failures === 0 ? 'completed' : 'error'
        };
    }

    _printSessionURL() {
        const capabilities = global.browser.capabilities;
        return new Promise((resolve,reject) => request.get(
            `https://www.browserstack.com/automate/sessions/${this.sessionId}.json`,
            {
                json: true,
                auth: {
                    user: this.auth.user,
                    pass: this.auth.key
                }
            },
            (error, response, body) => {
                if (error) {
                    return reject(error);
                }
                if (response.statusCode === 200) {
                    // These keys describe the browser the test was run on
                    const browserDesc = [
                        'device',
                        'os',
                        'osVersion',
                        'os_version',
                        'browserName',
                        'browser',
                        'browserVersion',
                        'browser_version'
                    ];
                    const browserString = browserDesc
                        .map(k => capabilities[k])
                        .filter(v => !!v)
                        .join(' ');

                    log.info(
                        `${browserString} session: ${body.automation_session
                            .browser_url}`
                    );
                    return resolve(body);
                }

                return reject(`Bad response code: Expected (200), Received (${response.statusCode})!`)
            }
        ));
    }
}
