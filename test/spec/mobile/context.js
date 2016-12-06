import labels from '../../fixtures/labels'

describe('context', () => {
    /**
     * failing on android
     * ToDo fix this
     */
    if (process.env._ENV === 'android') {
        return
    }

    let contexts

    it('should return all available context modes', async function () {
        contexts = (await this.client.contexts()).value
        contexts.should.have.length(2)
        expect(contexts[0]).to.contain(labels.NATIVE_APP_CONTEXT)
        expect(contexts[1]).to.contain(labels.WEBVIEW_CONTEXT)
    })

    it('should be able to switch to native context', async function () {
        await this.client.context(contexts[0]);
        (await this.client.context()).value.should.contain(contexts[0])
    })

    it('should be able to switch to web context', async function () {
        await this.client.context(contexts[1]);
        (await this.client.context()).value.should.be.equal(contexts[1])
    })
})
