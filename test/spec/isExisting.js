describe('isExisting', () => {
    it('should check if an element is existing', async function () {
        (await this.client.isExisting('div')).should.be.true
    })

    it('should check if an element is not existing', async function () {
        (await this.client.isExisting('#notExistingElement')).should.be.false
    })
})
