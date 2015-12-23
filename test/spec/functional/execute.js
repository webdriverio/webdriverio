import conf from '../../conf/index.js'

describe('execute boob', () => {
    it('should be able to execute some js', async function () {
        (await this.client.execute('return document.title', [])).value.should.be.equal(conf.testPage.title)
    })

    it('should be forgiving on giving an `args` parameter', async function () {
        (await this.client.execute('return document.title')).value.should.be.equal(conf.testPage.title)
    })

    it('should be able to execute a pure function', async function () {
        (await this.client.execute(() => document.title)).value.should.be.equal(conf.testPage.title)
    })

    it('should be able to take just a single function', async function () {
        await this.client.execute(() => {
            window.testThatStuff = true
        });

        (await this.client.execute(() => window.testThatStuff)).value.should.be.true
    })
})
