describe('orientation commands', () => {
    it('should get current orientation (getOrientation)', async function () {
        (await this.client.getOrientation()).should.be.equal('portrait')
    })

    it('should change the orientation (setOrientation)', async function () {
        await this.client.setOrientation('landscape');
        (await this.client.getOrientation()).should.be.equal('landscape')
    })

    after(async function () {
        await this.client.setOrientation('portrait')
    })
})
