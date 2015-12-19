describe('getValue', () => {
    it('should return the text of a single element', async function () {
        (await this.client.getValue('[name="a"]')).should.be.equal('a')
    })

    it('should return the text of multiple elements', async function () {
        const values = await this.client.getValue('form input[name]')
        values.should.be.an.instanceOf(Array)
        values.should.have.length(4)
        values.should.contain('a')
        values.should.contain('b')
        values.should.contain('c')
        values.should.contain('d')
    })
})
