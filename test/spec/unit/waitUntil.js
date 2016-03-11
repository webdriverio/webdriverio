describe('waitUntil', () => {
    before(global.setupInstance)

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
            error.message.should.be.equal('Promise was rejected with the following reason: timeout')
        }
    })

    it('should get rejected', async function () {
        let error
        try {
            await this.client.waitUntil(() => new Promise((_, r) => setTimeout(() => r('foobar'), 500)), 1000)
        } catch (e) {
            error = e
        } finally {
            error.message.should.match(/Promise was rejected with the following reason/)
        }
    })

    it('should timeout', async function () {
        let error
        try {
            await this.client.waitUntil(() => new Promise((r) => setTimeout(() => r('foobar'), 1000)), 500)
        } catch (e) {
            error = e
        } finally {
            error.message.should.be.equal('Promise was rejected with the following reason: timeout')
        }
    })

    it('should allow a promise condition', async function () {
        (await this.client.waitUntil(new Promise((r) => setTimeout(() => r('foobar'), 500)), 1000))
            .should.be.equal('foobar')
    })

    it('should pass fast with a short waitfor interval', async function () {
        let res = await this.client.waitUntil(() => new Promise((r) => setTimeout(() => r('foobar'), 50)), 100, 20)
        res.should.be.equal('foobar')
    })

    it('should timeout with a long waitfor interval', async function() {
        try {
            await this.client.waitUntil(() => new Promise((r) => setTimeout(() => r('foobar'), 50)), 100, 250)
        } catch (error) {
            error.message.should.be.equal('Promise was rejected with the following reason: timeout')
        }
    })

    it('should bind `this` to the waitUntil function', async function() {
        (await this.client.waitUntil(
            function () {
              return Promise.resolve(this.waitUntil)
            },
            1000
        )).should.be.equal(this.client.waitUntil)
    })
})
