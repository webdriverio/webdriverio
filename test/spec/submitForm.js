describe('submitForm', () => {
    it('should send data from form', async function () {
        (await this.client.isExisting('.gotDataA')).should.be.equal(false);
        (await this.client.isExisting('.gotDataB')).should.be.equal(false);
        (await this.client.isExisting('.gotDataC')).should.be.equal(false)

        await this.client.submitForm('.send').pause(1000);

        (await this.client.isExisting('.gotDataA')).should.be.equal(true);
        (await this.client.isExisting('.gotDataB')).should.be.equal(true);
        (await this.client.isExisting('.gotDataC')).should.be.equal(true)
    })
})
