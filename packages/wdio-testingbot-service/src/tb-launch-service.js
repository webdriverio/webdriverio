import request from 'request'
import testingbotTunnel from 'testingbot-tunnel-launcher'

const jobDataProperties = ['name', 'tags', 'public', 'build', 'extra']

export default class TestingBotService {
    /**
     * modify config and launch tb tunnel
     */
    onPrepare (config) {
        if (!config.tbTunnel) {
            return
        }

        this.tbTunnelOpts = Object.assign({
            apiKey: config.user,
            apiSecret: config.key
        }, config.tbTunnelOpts)

        config.protocol = 'http'
        config.host = 'localhost'
        config.port = 4445

        return new Promise((resolve, reject) => testingbotTunnel(this.tbTunnelOpts, (err, tunnel) => {
            if (err) {
                return reject(err)
            }

            this.tunnel = tunnel
            return resolve()
        }))
    }

    /**
     * shut down the tunnel
     */
    onComplete () {
        if (!this.tunnel) {
            return
        }

        return new Promise(resolve => this.tunnel.close(resolve))
    }

    /**
     * gather information about runner
     */
    before (capabilities) {
        this.sessionId = global.browser.sessionId
        this.capabilities = capabilities
        this.auth = global.browser.requestHandler.auth || {}
        this.tbUser = this.auth.user
        this.tbSecret = this.auth.pass
        this.testCnt = 0
        this.failures = 0
    }

    beforeSuite (suite) {
        this.suiteTitle = suite.title
    }

    beforeTest (test) {
        if (!this.tbUser || !this.tbSecret) {
            return
        }

        /**
         * in jasmine we get Jasmine__TopLevel__Suite as title since service using test
         * framework hooks in order to execute async functions.
         * This tweak allows us to set the real suite name for jasmine jobs.
         */
        if (this.suiteTitle === 'Jasmine__TopLevel__Suite') {
            this.suiteTitle = test.fullName.slice(0, test.fullName.indexOf(test.name) - 1)
        }

        global.browser.execute('tb:test-context=' + test.parent + ' - ' + test.title)
    }

    afterTest (test) {
        if (!test.passed) {
            ++this.failures
        }
    }

    beforeFeature (feature) {
        if (!this.tbUser || !this.tbSecret) {
            return
        }

        this.suiteTitle = feature.name || feature.getName()
        global.browser.execute('tb:test-context=Feature: ' + this.suiteTitle)
    }

    afterStep (feature) {
        if (feature.failureException || feature.getFailureException()) {
            ++this.failures
        }
    }

    beforeScenario (scenario) {
        if (!this.tbUser || !this.tbSecret) {
            return
        }
        const scenarioName = scenario.name || scenario.getName()
        global.browser.execute('tb:test-context=Scenario: ' + scenarioName)
    }

    /**
     * update TestingBot info
     */
    after () {
        if (!this.tbUser || !this.tbSecret) {
            return
        }

        return this.updateJob(this.sessionId, this.failures)
    }

    onReload (oldSessionId, newSessionId) {
        if (!this.tbUser || !this.tbSecret) {
            return
        }

        this.sessionId = newSessionId
        return this.updateJob(oldSessionId, this.failures, true)
    }

    getRestUrl (sessionId) {
        return `https://api.testingbot.com/v1/tests/${sessionId}`
    }

    updateJob (sessionId, failures, calledOnReload) {
        return new Promise((resolve, reject) => request.put(this.getRestUrl(sessionId), {
            json: true,
            auth: {
                user: this.tbUser,
                pass: this.tbSecret
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
        let body = { test: {} }

        /**
         * set default values
         */
        body.test['name'] = this.suiteTitle

        /**
         * add reload count to title if reload is used
         */
        if (calledOnReload || this.testCnt) {
            body.test['name'] += ` (${++this.testCnt})`
        }

        for (let prop of jobDataProperties) {
            if (!this.capabilities[prop]) {
                continue
            }

            body.test[prop] = this.capabilities[prop]
        }

        body.test['success'] = failures === 0 ? '1' : '0'
        return body
    }
}
