describe('setViewportSize/getViewportSize', () => {
    let windowSize = {}

    before(async function () {
        windowSize = await this.client.windowHandleSize()
    })

    beforeEach(async function () {
        await this.client.windowHandleSize({ width: 300, height: 300 })
    })

    it('should change viewport size of current window and should return the exact value', async function () {
        await this.client.setViewportSize({ width: 500, height: 500 }, true)

        const viewportSize = await this.client.getViewportSize()
        viewportSize.width.should.be.equal(500)
        viewportSize.height.should.be.equal(500)
    })

    it(`should set window size equal when parameter 'type' is true by default`, async function () {
        await this.client.setViewportSize({ width: 500, height: 500 })

        const viewportSize = await this.client.getViewportSize()
        viewportSize.width.should.be.equal(500)
        viewportSize.height.should.be.equal(500)

        const windowSize = await this.client.windowHandleSize()
        windowSize.value.width.should.be.greaterThan(499)
        windowSize.value.height.should.be.greaterThan(499)
    })

    it('should let windowHandleSize return bigger values since it includes menu and status bar heights', async function () {
        await this.client.setViewportSize({ width: 500, height: 500 }, false)

        const viewportSize = await this.client.getViewportSize()
        viewportSize.width.should.be.lessThan(501)
        viewportSize.height.should.be.lessThan(501)

        const windowSize = await this.client.windowHandleSize()
        windowSize.value.width.should.be.equal(500)
        windowSize.value.height.should.be.equal(500)
    })

    after(async function () {
        await this.client.windowHandleSize(windowSize.value)
    })
})
