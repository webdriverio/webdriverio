describe('getAttribute', () => {
    it('should get the attribute of a single element', async function () {
        (await this.client.getAttribute('.nested', 'style'))
            .should.be.equal('text-transform: uppercase;')
    })

    it('should get the attribute of multiple elements', async function () {
        const result = await this.client.getAttribute('.box', 'class')
        result.should.be.an.instanceOf(Array)
        result.should.have.length(5)

        result.forEach((className) =>
            className.should.startWith('box '))
    })
})
