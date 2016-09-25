import conf from '../../conf/index.js'

describe('staleElementRetry', () => {
    it('should not throw stale element error in standalone mode', async function () {
        let iterations = 50
        await this.client.url(conf.testPage.staleTest)
        while (iterations--) {
            let res = await this.client.isVisible('.staleElementContainer1 .stale-element-container-row')
            console.log(`staleElementRetry loop cnt: ${iterations}, command result: ${res}`)
            expect(res).to.be.true
        }
    })
})
