import conf from '../../conf/index'

describe('addCommand', () => {
    async function getUrlAndTitle () {
        return {
            url: (await this.url()).value,
            title: (await this.getTitle())
        }
    }

    before(function () {
        this.client.addCommand('getUrlAndTitle', getUrlAndTitle)
    })

    beforeEach(async function () {
        this.browserA.url(conf.testPage.gestureTest)
        this.browserB.url(conf.testPage.start)
        await this.client.sync()
    })

    it('added a `getUrlAndTitle` command', async function () {
        const { browserA, browserB } = await this.client.getUrlAndTitle()
        browserA.url.should.be.equal(conf.testPage.gestureTest)
        browserB.title.should.be.equal(conf.testPage.title)
    })

    it('should promisify added command', function () {
        return this.client.getUrlAndTitle().then(function (result) {
            result.browserA.url.should.be.equal(conf.testPage.gestureTest)
            result.browserB.title.should.be.equal(conf.testPage.title)
        })
    })

    it('should not register that command to other instances', async function () {
        expect(this.browserA.getUrlAndTitle).to.be.a('function')
        expect(this.browserB.getUrlAndTitle).to.be.a('function')
    })

    it('should add a namespaced getUrlAndTitle', async function () {
        this.client.addCommand('mynamespace', 'getUrlAndTitle', getUrlAndTitle)
        return this.client.mynamespace.getUrlAndTitle().then(function (result) {
            result.browserA.url.should.be.equal(conf.testPage.gestureTest)
            result.browserB.title.should.be.equal(conf.testPage.title)
        })
    })
})
