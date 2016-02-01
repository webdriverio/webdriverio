import labels from '../../../fixtures/labels'

describe.skip('swipe', () => {
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

    it('should swipe up', async function() {
        await this.client.swipeUp(labels.HITAREA, 500, 250)
        await this.client.context(labels.WEBVIEW_CONTEXT);

        (await this.client.getAttribute('#log-gesture-dragstart', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-dragend', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-dragup', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-drag', 'class')).should.be.equal('active')

        // swipe to the top again
        await this.client.context(labels.NATIVE_APP_CONTEXT).swipeUp(labels.HITAREA, 1000, 250)
    })

    it('should swipe right', async function() {
        await this.client.swipeRight(labels.HITAREA, 500, 250)
        await this.client.context(labels.WEBVIEW_CONTEXT);

        (await this.client.getAttribute('#log-gesture-dragstart', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-dragend', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-dragright', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-drag', 'class')).should.be.equal('active')
    })

    it('should swipe down', async function() {
        await this.client.swipeDown(labels.HITAREA, 500, 250)
        await this.client.context(labels.WEBVIEW_CONTEXT);

        (await this.client.getAttribute('#log-gesture-dragstart', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-dragend', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-dragdown', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-drag', 'class')).should.be.equal('active')
    })

    it('should swipe left', async function() {
        await this.client.swipeLeft(labels.HITAREA, 500, 250)
        await this.client.context(labels.WEBVIEW_CONTEXT);

        (await this.client.getAttribute('#log-gesture-dragstart', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-dragend', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-dragleft', 'class')).should.be.equal('active');
        (await this.client.getAttribute('#log-gesture-drag', 'class')).should.be.equal('active')
    })
})
