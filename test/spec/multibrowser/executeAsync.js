import conf from '../../conf/index'

describe('executeAsync', () => {
    beforeEach(async function () {
        this.browserA.url(conf.testPage.subPage)
        this.browserB.url(conf.testPage.start)
        await this.client.sync()
    })

    it('should execute an async function', async function () {
        await this.client.timeouts('script', 5000)
        const { browserA, browserB } = await this.client.executeAsync(
            (cb) => setTimeout(() => cb(document.title + '-async'), 500))

        browserA.value.should.be.equal('two-async')
        browserB.value.should.be.equal(conf.testPage.title + '-async')
    })
})
