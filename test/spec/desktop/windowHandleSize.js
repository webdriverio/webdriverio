import conf from '../../conf/index'

describe('windowHandleSize', () => {
    it('should change window size of current window if no handle is given', async function () {
        const requestHandler = this.client.requestHandler
        const origHandlerCreate = requestHandler.create

        this.client.requestHandler.create = function (options, data) {
            expect(options.path).to.match(/\/window\/current\/size$/)
            return origHandlerCreate.call(requestHandler, ...arguments)
        }

        try {
            await this.client.windowHandleSize({ width: 500, height: 500 })
        } finally {
            requestHandler.create = origHandlerCreate
        }

        const windowSize = await this.client.windowHandleSize()
        windowSize.value.width.should.be.equal(500)
        windowSize.value.height.should.be.equal(500)
    })

    it('should change window size of a different window using a window handle', async function () {
        // open new window
        await this.client.newWindow(conf.testPage.subPage, 'windowHandleSizeTest', 'width=200, height=300')

        // get all windows
        const tabs = await this.client.getTabIds()

        // switch to other tab
        await this.client.switchTab(tabs[0])

        // change window size of other tab
        await this.client.windowHandleSize(tabs[1], { width: 600, height: 700 })

        // check if other tab has now another size
        const windowSize = await this.client.windowHandleSize(tabs[1])
        windowSize.value.width.should.be.equal(600)
        windowSize.value.height.should.be.equal(700)

        await this.client.close(tabs[1])
    })
})
