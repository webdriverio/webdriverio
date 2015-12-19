import conf from '../conf/index'

describe('getTitle', () => {
    it('should return the text of a single element', async function () {
        (await this.client.getTitle()).should.be.equal(conf.testPage.title)
    })
})
