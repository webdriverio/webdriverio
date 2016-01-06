describe('windowHandleMaximize', () => {
    let windowSize = {}

    before(async function () {
        windowSize = await this.client.windowHandleSize()
    })

    it('should increase window size', async function () {
        // first set window size
        await this.client.windowHandleSize({ width: 500, height: 500 })

        // maximize the window
        await this.client.windowHandleMaximize()

        // check if window size got bigger
        const size = await this.client.windowHandleSize()
        // on some systems, we might not have maximized, like on phantomjs
        // still, no error means it worked
        size.value.width.should.be.above(500)
        size.value.height.should.be.above(500)
    })

    after(async function () {
        await this.client.windowHandleSize(windowSize.value)
    })
})
