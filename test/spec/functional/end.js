const WebdriverIO = require('../../../')

describe('end', () => {
    it('should delete a session', async function () {
        // at the beginning there is only one session
        (await this.client.sessions()).value.should.have.length(1)

        // create a new session
        const testDriver = WebdriverIO.remote({
            desiredCapabilities: {
                browserName: 'phantomjs'
            }
        })
        await testDriver.init();

        // now we should have two sessions
        (await this.client.sessions()).value.should.have.length(2)

        // end testDriver session
        await testDriver.end();

        // now there should be only one session again
        (await this.client.sessions()).value.should.have.length(1)
    })
})
