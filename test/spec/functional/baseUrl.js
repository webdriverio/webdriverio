describe('baseUrl', () => {
    it('should get prepended if url starts with /', async function () {
        await this.client.url('/test/site/www/two.html');
        (await this.client.getTitle()).should.be.equal('two')
    })
})
