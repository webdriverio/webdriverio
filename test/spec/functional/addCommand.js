import conf from '../../conf/index'

describe('addCommand', () => {
    async function getUrlAndTitle () {
        return {
            url: (await this.url()).value,
            title: (await this.getTitle())
        }
    }

    describe('add regular command', () => {
        before(function () {
            this.client.addCommand('getUrlAndTitle', getUrlAndTitle)
        })

        it('added a `getUrlAndTitle` command', async function () {
            const result = await this.client.getUrlAndTitle()
            result.url.should.be.equal(conf.testPage.start)
            result.title.should.be.equal(conf.testPage.title)
        })

        it('should promisify added command', async function () {
            return this.client.getUrlAndTitle().then((result) => {
                result.url.should.be.equal(conf.testPage.start)
                result.title.should.be.equal(conf.testPage.title)
            })
        })
    })

    describe('try to add an existing command', () => {
        it('should throw an error', function () {
            expect(() => this.client.addCommand('shake', () => 'should fail')).to.throw()
        })

        it('should overwrite existing method if overwrite flag is given', async function () {
            this.client.addCommand('shake', () => 'should not fail', true);
            (await this.client.shake()).should.be.equal('should not fail')
        })
    })

    describe('add a namespaced command', () => {
        it('should add a namespaced getUrlAndTitle', async function () {
            this.client.addCommand('mynamespace', 'getUrlAndTitle', getUrlAndTitle)
            const result = await this.client.mynamespace.getUrlAndTitle()
            result.url.should.be.equal(conf.testPage.start)
            result.title.should.be.equal(conf.testPage.title)
        })

        it('should not allow overwriting internal functions', function () {
            expect(() => this.client.addCommand('shake', 'mycommand', () => 'should fail', true)).to.throw()
        })

        it('should not overwrite commands by default', function () {
            this.client.addCommand('mynamespace', 'mycommand', getUrlAndTitle)
            expect(() => this.client.addCommand('mynamespace', 'mycommand', () => 'should fail')).to.throw()
        })

        it('should overwrite existing namespaced method if overwrite flag is given', async function () {
            this.client.addCommand('mynamespace', 'mysecondcommand', getUrlAndTitle)
            this.client.addCommand('mynamespace', 'mysecondcommand', () => 'should not fail', true);
            (await this.client.mynamespace.mysecondcommand()).should.be.equal('should not fail')
        })
    })
})
