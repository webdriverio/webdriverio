describe('element as first class citizen', () => {
    it('should return a color attribute to test with properly', async function () {
        let bgColor = await this.client.element('.red').getCssProperty('background-color')
        expect(bgColor.value).to.be.equal('rgba(255,0,0,1)')
    })

    it('should return the text of a single element', async function () {
        let text = await this.client.element('#githubRepo').getText()
        expect(text).to.be.equal('GitHub Repo')
    })

    it('should return a specific property width of the location if set', async function () {
        let x = await this.client.element('header h1').getLocation('x')
        x.should.be.below(27)
    })

    it('should get the attribute of a single element', async function () {
        let result = await this.client.element('.nested').getAttribute('style')
        expect(result).to.be.equal('text-transform: uppercase;')
    })

    it('should add selector when returning error with errorCode 7', async function () {
        try {
            await this.client.element('span=notExisting').getValue()
        } catch (e) {
            expect(e.message).to.be.contain('given search parameters ("span=notExisting").')
        }
    })

    it('should keep scope if element call is nested', async function () {
        let errorMessage

        try {
            await this.client.element('=two').waitForExist('.page')
        } catch (e) {
            errorMessage = e.message
        }

        expect(errorMessage).to.be.equal('element (".page") still not existing after 1000ms')
    })
})
