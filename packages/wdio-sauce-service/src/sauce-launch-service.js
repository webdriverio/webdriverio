import request from 'request'
import SauceConnectLauncher from 'sauce-connect-launcher'

const jobDataProperties = ['name', 'tags', 'public', 'build', 'custom-data']

const jasmineTopLevelSuite = 'Jasmine__TopLevel__Suite'

export default class SauceService {
    /**
     * modify config and launch sauce connect
     */
    onPrepare (config, capabilities) {
        if (!config.sauceConnect) {
            return
        }

        this.sauceConnectOpts = Object.assign({
            username: config.user,
            accessKey: config.key
        }, config.sauceConnectOpts)

        config.protocol = 'http'
        config.host = 'localhost'
        config.port = this.sauceConnectOpts.port || 4445

        const sauceConnectTunnelIdentifier = this.sauceConnectOpts.tunnelIdentifier

        if (sauceConnectTunnelIdentifier) {
            if (Array.isArray(capabilities)) {
                capabilities.forEach(capability => {
                    capability.tunnelIdentifier = capability.tunnelIdentifier || sauceConnectTunnelIdentifier
                })
            } else {
                Object.keys(capabilities).forEach(browser => {
                    capabilities[browser].desiredCapabilities.tunnelIdentifier = capabilities[browser].desiredCapabilities.tunnelIdentifier || sauceConnectTunnelIdentifier
                })
            }
        }

        return new Promise((resolve, reject) => SauceConnectLauncher(this.sauceConnectOpts, (err, sauceConnectProcess) => {
            if (err) {
                return reject(err)
            }

            this.sauceConnectProcess = sauceConnectProcess
            return resolve()
        }))
    }

    /**
     * shut down sauce connect
     */
    onComplete () {
        if (!this.sauceConnectProcess) {
            return
        }

        return new Promise(resolve => this.sauceConnectProcess.close(resolve))
    }

    /**
     * gather information about runner
     */
    before (capabilities) {
        this.sessionId = global.browser.sessionId
        this.capabilities = capabilities
        this.auth = global.browser.requestHandler.auth || {}
        this.sauceUser = this.auth.user
        this.sauceKey = this.auth.pass
        this.testCnt = 0
        this.failures = 0 // counts failures between reloads
    }

    getSauceRestUrl (sessionId) {
        return `https://saucelabs.com/rest/v1/${this.sauceUser}/jobs/${sessionId}`
    }

    beforeSuite (suite) {
        this.suiteTitle = suite.title
    }

    beforeTest (test) {
        if (!this.sauceUser || !this.sauceKey) {
            return
        }

        /**
         * in jasmine we get Jasmine__TopLevel__Suite as title since service using test
         * framework hooks in order to execute async functions.
         * This tweak allows us to set the real suite name for jasmine jobs.
         */
        if (this.suiteTitle === 'Jasmine__TopLevel__Suite') {
            this.suiteTitle = test.fullName.slice(0, test.fullName.indexOf(test.title) - 1)
        }

        const context = test.parent === jasmineTopLevelSuite ? test.fullName : test.parent + ' - ' + test.title

        global.browser.execute('sauce:context=' + context)
    }

    afterSuite (suite) {
        if (suite.hasOwnProperty('err')) {
            ++this.failures
        }
    }

    afterTest (test) {
        if (!test.passed) {
            ++this.failures
        }
    }

    beforeFeature (feature) {
        if (!this.sauceUser || !this.sauceKey) {
            return
        }

        this.suiteTitle = feature.name || feature.getName()
        global.browser.execute('sauce:context=Feature: ' + this.suiteTitle)
    }

    afterStep (feature) {
        if (
            /**
             * Cucumber v1
             */
            feature.failureException ||
            /**
             * Cucumber v2
             */
            (typeof feature.getFailureException === 'function' && feature.getFailureException())
        ) {
            ++this.failures
        }
    }

    beforeScenario (scenario) {
        if (!this.sauceUser || !this.sauceKey) {
            return
        }

        const scenarioName = scenario.name || scenario.getName()
        global.browser.execute('sauce:context=Scenario: ' + scenarioName)
    }

    /**
     * update Sauce Labs job
     */
    after () {
        if (!this.sauceUser || !this.sauceKey) {
            return
        }

        return this.updateJob(this.sessionId, this.failures)
    }

    onReload (oldSessionId, newSessionId) {
        if (!this.sauceUser || !this.sauceKey) {
            return
        }

        this.sessionId = newSessionId
        return this.updateJob(oldSessionId, this.failures, true)
    }

    updateJob (sessionId, failures, calledOnReload = false) {
        return new Promise((resolve, reject) => request.put(this.getSauceRestUrl(sessionId), {
            json: true,
            auth: {
                user: this.sauceUser,
                pass: this.sauceKey
            },
            body: this.getBody(failures, calledOnReload)
        }, (e, res, body) => {
            if (e) {
                return reject(e)
            }
            global.browser.jobData = body
            this.failures = 0
            return resolve(body)
        }))
    }

    /**
     * massage data
     */
    getBody (failures, calledOnReload = false) {
        let body = {}

        /**
         * set default values
         */
        body.name = this.suiteTitle

        /**
         * add reload count to title if reload is used
         */
        if (calledOnReload || this.testCnt) {
            body.name += ` (${++this.testCnt})`
        }

        for (let prop of jobDataProperties) {
            if (!this.capabilities[prop]) {
                continue
            }

            body[prop] = this.capabilities[prop]
        }

        body.passed = failures === 0
        return body
    }
}
