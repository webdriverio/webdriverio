import conf from '../conf/index'

describe('getTitle', () => {
    it('should return the url of the current webpage', async function () {
        (await this.client.getUrl()).should.be.equal(conf.testPage.start)
    })
})
