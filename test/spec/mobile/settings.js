describe('settings', () => {
    it('should be able to set and get settings on device', async function () {
        await this.client.settings({foo: 'bar'});
        (await this.client.settings()).value.foo.should.be.equal('bar')
    })
})
