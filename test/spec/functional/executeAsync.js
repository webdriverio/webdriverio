import conf from '../../conf/index.js'

describe('executeAsync', () => {
    it('should execute an async function', async function () {
        await this.client.timeouts('script', 5000);
        (await this.client.executeAsync((cb) => {
            setTimeout(function () {
                cb(document.title + '-async')
            }, 500)
        })).value.should.be.equal(conf.testPage.title + '-async')
    })
})
