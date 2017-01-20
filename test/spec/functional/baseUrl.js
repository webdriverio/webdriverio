describe('baseUrl', () => {
    it('should get prepended if url starts with /', async function () {
        await this.client.url('/two.html');
        (await this.client.getTitle()).should.be.equal('two')
    })

    it('should get prepended if url starts with ?', async function () {
        await this.client.url('?foo=bar')

        const title = await this.client.getTitle()
        title.should.be.equal('WebdriverIO Testpage')

        const url = await this.client.getUrl()
        url.should.contain('?foo=bar')
    })
})
