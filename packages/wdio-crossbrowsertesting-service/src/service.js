import logger from '@wdio/logger'
var request = require('request')
var cbt = require('cbt_tunnels');


const log = logger('@wdio/crossbrowsertesting-service')

export default class CrossBrowserTestingService {

    constructor(){
        this.testCnt = 0
        this.failures = 0
    }

    beforeSession(config, capabilities){
        this.config = config
        this.capabilities = capabilities;
        this.config.user = config.user
        this.config.key = config.key
        this.cbtUsername = this.config.user;
        this.cbtAuthkey = this.config.pass;
        this.isServiceEnabled = this.cbtUsername && this.cbtAuthkey
        
    }

    beforeSuite (suite) {
        this.suiteTitle = suite.title
    }

    beforeTest(test){
        if(!this.isServiceEnabled){
            return;
        }
    }

    afterSuite(suite) {
        if (suite.hasOwnProperty('error')) {
            this.failures++
        }
    }

     afterTest(test) {
        if (!test.passed) {
            ++this.failures
        }
    }

    after() {
        if (!this.cbtUsername || !this.cbtAuthkey) {
            return;
        }

        return this.updateJob(this.sessionId, this.failures);
    }

    getSessionUrl (sessionId) {
        return `https://crossbrowsertesting.com/api/v3/selenium/${sessionId}`;
        
    }

    onReload(oldSessionId, newSessionId){
        if (!this.cbtUsername || !this.cbtAuthkey) {
            return;
        }
        this.sessionId = newSessionId;
        return this.updateJob(oldSessionId, this.failures, true)
    }

    updateJob (sessionId, failures, calledOnReload = false) {
        return new Promise((resolve, reject) => request.put(this.getSessionUrl(sessionId), {
            json: true,
            auth: {
                user: this.cbtUsername,
                pass: this.cbtAuthkey
            },
            body: this.getBody(failures, calledOnReload)
        }, (e, res, body) => {
            if (e) {
                return reject(e)
            }
            global.browser.jobData = body
            this.failures = 0
            resolve(body)
        }))
    }

     getBody (failures, calledOnReload = false) {
        let body = {}
        body.name = this.suiteTitle
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
