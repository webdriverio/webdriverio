describe.only('execute', () => {
    let contexts

    before(async function () {
        contexts = (await this.client.contexts()).value
    })

    describe('NATIVE context', () => {
        before(async function () {
            await this.client.context(contexts[0])
        })

        /**
         * can't be executed in native context due to wrong ios driver behavior
         */
        it.skip('should be able to execute native function objects', async function () {
            (await this.client.execute((a) => a + 2, 3)).value.should.be.equal(5)
        })

        it('should be able to execute strings', async function () {
            (await this.client.execute('3 + 2')).value.should.be.equal(5) // no correct according protocol
            // (await this.client.execute('return 3 + 2')).value.should.be.equal(5)
        })
    })

    describe('WEBVIEW context', () => {
        before(async function () {
            await this.client.context(contexts[1])
        })

        it('should be able to execute native function objects', async function () {
            (await this.client.execute((a) => a + 2, 3)).value.should.be.equal(5)
        })

        it('should be able to execute strings', async function () {
            (await this.client.execute('return 3 + 2')).value.should.be.equal(5)
        })
    })
})
