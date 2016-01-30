import labels from '../../fixtures/labels'

describe('context', () => {
    /**
     * failing on android
     * ToDo fix this
     */
    if (process.env._ENV === 'android') {
        return
    }

    it('should return all available context modes', async function () {
        const contexts = await this.client.contexts()
        contexts.value.should.have.length(2)
        expect(contexts.value).to.include(labels.NATIVE_APP_CONTEXT)
        expect(contexts.value).to.include(labels.WEBVIEW_CONTEXT)
    })

    it('should return the current context mode', async function () {
        await this.client.context(labels.WEBVIEW_CONTEXT);
        (await this.client.context()).value.should.be.equal(labels.WEBVIEW_CONTEXT)
    })

    it('should be able to switch to native context', async function () {
        await this.client.context(labels.NATIVE_APP_CONTEXT);
        (await this.client.context()).value.should.be.equal(labels.NATIVE_APP_CONTEXT)
    })
})
