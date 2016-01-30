import labels from '../../../fixtures/labels'

describe('touch', () => {
    /**
     * not working in CI
     */
    if (process.env.CI) {
        return
    }

    beforeEach(async function () {
        await this.client
            .pause(3000)
            .context(labels.WEBVIEW_CONTEXT)
            .click('=2')
            .context(labels.NATIVE_APP_CONTEXT)
            .pause(3000)
    })

    it('should do a long touch', async function() {
        await this.client.touch(labels.HITAREA, true)
        await this.client.context(labels.WEBVIEW_CONTEXT);

        (await this.client.getAttribute('#log-gesture-touch', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-hold', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-release', 'class')).should.be.equal('active')
    })
})
