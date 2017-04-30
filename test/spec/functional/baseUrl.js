const url = require('url')

describe('baseUrl', () => {
    let baseUrl

    before(async function() {
        this.client.options.baseUrl += '/base-url/'
        baseUrl = url.parse(this.client.options.baseUrl)
    })

    it('should get prepended and replace pathname if url starts with /', async function () {
        await this.client.url('/two.html');
        (await this.client.getTitle()).should.be.equal('two')

        const actualUrl = await this.client.getUrl()
        url.parse(actualUrl).pathname.should.be.equal('/two.html')
    })

    it('should get prepended if url starts with ?', async function () {
        await this.client.url('?foo=bar')

        const title = await this.client.getTitle()
        title.should.be.equal('WebdriverIO Testpage')

        const actualUrl = url.parse(await this.client.getUrl())

        actualUrl.pathname.should.be.equal(baseUrl.pathname)
        actualUrl.query.should.be.equal('foo=bar')
    })

    it('should get prepended if url dont starts with / or ?', async function () {
        await this.client.url('two.html')

        const actualUrl = url.parse(await this.client.getUrl())
        actualUrl.pathname.should.be.equal(`${baseUrl.pathname}two.html`)
    })
})
