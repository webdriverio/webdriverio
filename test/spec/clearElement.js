describe('clearElement', () => {
    const input = 'input[name="a"]'

    it('knows to clear elements', async function () {
        (await this.client.getValue(input)).should.be.equal('a')
        await this.client.clearElement(input);
        (await this.client.getValue(input)).should.be.equal('')
    })
})
