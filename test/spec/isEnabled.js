describe('isEnabled', () => {
    it('should check if a single element is visible', async function () {
        (await this.client.isEnabled('input[name="d"]')).should.be.false;
        (await this.client.isEnabled('input[name="b"]')).should.be.true
    })

    it('should check multiple elements are visible', async function () {
        const isEnabled = await this.client.isEnabled('form input')
        isEnabled.should.be.an.instanceOf(Array)
        isEnabled.should.have.length(6)
    })
})
