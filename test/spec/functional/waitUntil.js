describe('waitUntil', () => {
    it('should pass', async function () {
        (await this.client.waitUntil(
            () => new Promise((r) => setTimeout(() => r('foobar'), 500)),
            1000
        )).should.be.equal('foobar')
    })

    it('should fail', async function () {
        let error
        try {
            await this.client.waitUntil(() => new Promise((r) => setTimeout(() => r(false), 500)), 1000)
        } catch (e) {
            error = e
        } finally {
            error.message.should.match(/Promise never resolved with an truthy value/)
        }
    })

    it('should get rejected', async function () {
        let error
        try {
            await this.client.waitUntil(() => new Promise((_, r) => setTimeout(() => r('foobar'), 500)), 1000)
        } catch (e) {
            error = e
        } finally {
            error.message.should.match(/Promise was fulfilled but got rejected/)
        }
    })

    it('should timeout', async function () {
        let error
        try {
            await this.client.waitUntil(() => new Promise((r) => setTimeout(() => r('foobar'), 1000)), 500)
        } catch (e) {
            error = e
        } finally {
            error.message.should.match(/Promise never resolved with an truthy value/)
        }
    })

    it('should allow a promise condition', async function () {
        (await this.client.waitUntil(new Promise((r) => setTimeout(() => r('foobar'), 500)), 1000))
            .should.be.equal('foobar')
    })
})
