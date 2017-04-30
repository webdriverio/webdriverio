describe('baseUrl', () => {
    let origBaseUrl

    before(function () {
        origBaseUrl = this.client.options.baseUrl
    })

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

    it('should get prepended if url dont starts with / or ?', async function () {
        this.client.options.baseUrl += '/subdir/'
        await this.client.url('basetest.html')

        const title = await this.client.getTitle()
        title.should.be.equal('baseUrl test')

        await this.client.url('/two.html');
        (await this.client.getTitle()).should.be.equal('two')

        await this.client.url('/two.html');
        (await this.client.getTitle()).should.be.equal('two')
    })

    after(function () {
        this.client.options.baseUrl = origBaseUrl
    })
})
