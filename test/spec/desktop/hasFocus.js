describe('hasFocus', () => {
    it('should return true if element is active', async function () {
        (await this.client.hasFocus('[name="login"]')).should.be.true
    })

    it('should return false on inactive elements', async function () {
        (await this.client.hasFocus('body')).should.be.false
    })
})
