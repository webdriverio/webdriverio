describe('pause', () => {
    before(global.setupInstance)

    it('should pause command queue', async function () {
        var time = new Date().getTime()
        await this.client.pause(1000)
        var newTime = new Date().getTime();
        (newTime - time).should.be.greaterThan(999);
        (newTime - time).should.be.lessThan(1020)
    })
})
