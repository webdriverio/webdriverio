describe('baseUrl', () => {
    beforeEach(async function () {
        this.browserA.url('/')
        this.browserB.url('/')
        await this.client.sync()
    })

    it('should have opened the base url', async function () {
        const { browserA, browserB } = await this.client.url()
        browserA.value.should.contain('google')
        browserB.value.should.contain('yahoo')
    })
})
