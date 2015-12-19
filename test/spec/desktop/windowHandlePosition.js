describe('windowHandlePosition', () => {
    it('should return window position of specified window', async function () {
        const tabid = await this.client.getCurrentTabId()
        const windowPosition = await this.client.windowHandlePosition(tabid)
        windowPosition.value.x.should.be.above(process.env.TRAVIS ? -9 : 1)
        windowPosition.value.y.should.be.above(process.env.TRAVIS ? -9 : 1)
    })

    it('should return window position of current window', async function () {
        const windowPosition = await this.client.windowHandlePosition()
        windowPosition.value.x.should.be.above(process.env.TRAVIS ? -9 : 1)
        windowPosition.value.y.should.be.above(process.env.TRAVIS ? -9 : 1)
    })

    it('should change window position of specified window', async function () {
        const tabid = await this.client.getCurrentTabId()
        await this.client.windowHandlePosition(tabid, {x: 300, y: 150})

        const windowPosition = await this.client.windowHandlePosition()
        windowPosition.value.x.should.be.equal(300)
        windowPosition.value.y.should.be.equal(150)
    })

    it('should change window position of current window', async function () {
        await this.client.windowHandlePosition({x: 400, y: 250})

        const windowPosition = await this.client.windowHandlePosition()
        windowPosition.value.x.should.be.equal(400)
        windowPosition.value.y.should.be.equal(250)
    })
})
