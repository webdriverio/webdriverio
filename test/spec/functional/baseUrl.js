describe('baseUrl', () => {
    it('should get prepended if url starts with /', async function () {
        await this.client.url('/two.html');
        (await this.client.getTitle()).should.be.equal('two')
    })
})
