describe('shake device', () => {
    it('should execute command successfully', async function () {
        (await this.client.shake()).status.should.be.equal(0)
    })
})
