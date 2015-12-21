import conf from '../../conf/index'

describe('execute', () => {
    beforeEach(async function () {
        this.browserA.url(conf.testPage.subPage)
        this.browserB.url(conf.testPage.start)
        await this.client.sync()
    })

    it('should be able to execute some js', async function () {
        const { browserA, browserB } = await this.client.execute('return document.title')
        browserA.value.should.be.equal('two')
        browserB.value.should.be.equal(conf.testPage.title)
    })

    it('should be forgiving on giving an `args` parameter', async function () {
        const { browserA, browserB } = await this.client.execute('return document.title')
        browserA.value.should.be.equal('two')
        browserB.value.should.be.equal(conf.testPage.title)
    })

    it('should be able to execute a pure function', async function () {
        const { browserA, browserB } = await this.client.execute(function () {
            return document.title
        })
        browserA.value.should.be.equal('two')
        browserB.value.should.be.equal(conf.testPage.title)
    })
})
