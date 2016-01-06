import conf from '../../conf/index'

describe('getTabIds', () => {
    it('should return a single tab id', async function () {
        const tabs = await this.client.getTabIds()
        tabs.should.be.an.instanceOf(Array)
        tabs.should.have.length(1)
    })

    it('should return two tab ids after openening a new window', async function () {
        await this.client.newWindow(conf.testPage.subPage)

        const tabs = await this.client.getTabIds()
        tabs.should.be.an.instanceOf(Array)
        tabs.should.have.length(2)

        await this.client.close()
    })
})
