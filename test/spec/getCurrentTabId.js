describe('getCurrentTabId', () => {
    it('should return a single tab id', async function () {
        (await this.client.getCurrentTabId()).should.be.a('string')
    })
})
