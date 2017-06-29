describe('getAttribute', () => {
    it('should get the attribute of a single element', async function () {
        const browser = this.client.desiredCapabilities.browserName
        const attr = browser === 'MicrosoftEdge' ? 'text-transform: uppercase' : 'text-transform: uppercase;';
        (await this.client.getAttribute('.nested', 'style')).should.be.equal(attr)
    })

    it('should get the attribute of multiple elements', async function () {
        const result = await this.client.getAttribute('.box', 'class')
        result.should.be.an.instanceOf(Array)
        result.should.have.length(5)

        result.forEach((className) =>
            className.should.startWith('box '))
    })
})
