describe('lock device', () => {
    /**
     * not working in CI
     */
    if (process.env.CI) {
        return
    }

    it('should be unlocked before test', async function () {
        (await this.client.isLocked()).value.should.be.false
    })

    it('should lock the device', async function () {
        await this.client.lock();
        (await this.client.isLocked()).value.should.be.true
    })

    it('should unlock the device', async function () {
        await this.client.unlock();
        (await this.client.isLocked()).value.should.be.false
    })
})
