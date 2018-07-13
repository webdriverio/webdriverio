import request from 'request'
import testingbotTunnel from 'testingbot-tunnel-launcher'

const jobDataProperties = ['name', 'tags', 'public', 'build', 'extra']

export default class TestingBotService {
    /**
     * Modify config and launch tb tunnel
     * @param   {Object} config Wdio config
     * @returns {Promise}       Resolved promise if tunnel launched successfully or rejected promise with error if tunnel failed to start
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
            /* istanbul ignore if */
            if (err) {
                return reject(err)
            }

            this.tunnel = tunnel
            return resolve()
        }))
    }

    /**
     * Shut down the tunnel
     * @returns {Promise} Resolved promise when tunnel is closed
     */
    onComplete () {
        if (!this.tunnel) {
            return
        }

        return new Promise(resolve => this.tunnel.close(resolve))
    }

    /**
     * Gather information about runner
     * @param {Object} capabilities Capabilities
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

    /**
     * Before suite
     * @param {Object} suite Suite
     */
    beforeSuite (suite) {
        this.suiteTitle = suite.title
    }

    /**
     * Before test
     * @param {Object} test Test
     */
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

    /**
     * After test
     * @param {Object} test Test
     */
    afterTest (test) {
        if (!test.passed) {
            ++this.failures
        }
    }

    /**
     * Before feature
     * @param {Object} feature Feature
     */
    beforeFeature (feature) {
        if (!this.tbUser || !this.tbSecret) {
            return
        }

        this.suiteTitle = feature.name || feature.getName()
        global.browser.execute('tb:test-context=Feature: ' + this.suiteTitle)
    }

    /**
     * After step
     * @param {Object} feature Feature
     */
    afterStep (feature) {
        if (feature.failureException || feature.getFailureException()) {
            ++this.failures
        }
    }

    /**
     * Before scenario
     * @param {Object} scenario Scenario
     */
    beforeScenario (scenario) {
        if (!this.tbUser || !this.tbSecret) {
            return
        }
        const scenarioName = scenario.name || scenario.getName()
        global.browser.execute('tb:test-context=Scenario: ' + scenarioName)
    }

    /**
     * Update TestingBot info
     * @return {Promise} Promsie with result of updateJob method call
     */
    after () {
        if (!this.tbUser || !this.tbSecret) {
            return
        }

        return this.updateJob(this.sessionId, this.failures)
    }

    /**
     * On TestingBot tunnel reload
     * @param   {String} oldSessionId Old session id
     * @param   {String} newSessionId New session id
     * @returns {Promise}             Promsie with result of updateJob method call
     */
    onReload (oldSessionId, newSessionId) {
        if (!this.tbUser || !this.tbSecret) {
            return
        }

        this.sessionId = newSessionId
        return this.updateJob(oldSessionId, this.failures, true)
    }

    /**
     *
     * @param   {String} sessionId Session id
     * @returns {String}           TestingBot API URL
     */
    getRestUrl (sessionId) {
        return `https://api.testingbot.com/v1/tests/${sessionId}`
    }

    /**
     *
     * @param   {String}  sessionId      Session id
     * @param   {String}  failures       Number of failed tests
     * @param   {boolean} calledOnReload If function was called on tunnel reload or not
     * @returns {Promise}                Resolved promise if request is successfull or rejected promise with error if request is failed
     */
    updateJob (sessionId, failures, calledOnReload) {
        return new Promise((resolve, reject) => request.put(this.getRestUrl(sessionId), {
            json: true,
            auth: {
                user: this.tbUser,
                pass: this.tbSecret
            },
            body: this.getBody(failures, calledOnReload)
        }, (e, res, body) => {
            /* istanbul ignore if */
            if (e) {
                return reject(e)
            }
            global.browser.jobData = body
            this.failures = 0
            return resolve(body)
        }))
    }

    /**
     * Get message data
     * @param   {number}  failures       Number of failed tests
     * @param   {boolean} calledOnReload If function was called on tunnel reload or not
     * @returns {Object}  body           Request body
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
