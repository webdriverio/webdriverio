const WebdriverIO = require('../../../')

describe('endAll', () => {
    it('should delete multiple sessions', async function () {
        // at the beginning there is only one session
        (await this.client.sessions()).value.should.have.length(1)

        // create two new session
        const testDriverA = WebdriverIO.remote({
            desiredCapabilities: {
                browserName: 'phantomjs'
            }
        })
        await testDriverA.init()
        const testDriverB = WebdriverIO.remote({
            desiredCapabilities: {
                browserName: 'phantomjs'
            }
        })
        await testDriverB.init();

        // now we should have two sessions
        (await this.client.sessions()).value.should.have.length(3)

        // end all sessions
        await testDriverB.endAll();

        // now there should be only one session again
        (await this.client.sessions()).value.should.have.length(0)
    })

    after(async function () {
        // reinitialise the session
        this.client.requestHandler.sessionID = null
        await this.client.init()
    })
})
