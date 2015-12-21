/* global $ */
describe('scroll', () => {
    let windowSize = {}

    before(async function () {
        windowSize = await this.client.windowHandleSize()
    })

    it('should scroll to specific x and y position', async function () {
        await this.client.windowHandleSize({width: 100, height: 100})
        await this.client.scroll(100, 100)

        const scrollPos = await this.client.execute(() => {
            return {
                x: $(document).scrollLeft(),
                y: $(document).scrollTop()
            }
        })

        scrollPos.value.x.should.be.equal(100)
        scrollPos.value.y.should.be.equal(100)
    })

    it('should scroll to specific element', async function () {
        await this.client.windowHandleSize({width: 100, height: 100})
        await this.client.scroll('.box')

        const scrollPos = await this.client.execute(() => {
            return {
                x: $(document).scrollLeft(),
                y: $(document).scrollTop()
            }
        })

        scrollPos.value.x.should.be.approximately(15, 15)
        scrollPos.value.y.should.be.approximately(262, 40)
    })

    it('should scroll to specific element with offset', async function () {
        await this.client.windowHandleSize({width: 100, height: 100})
        await this.client.scroll('.box', -10, -22)

        const scrollPos = await this.client.execute(() => {
            return {
                x: $(document).scrollLeft(),
                y: $(document).scrollTop()
            }
        })

        scrollPos.value.x.should.be.approximately(5, 15)
        scrollPos.value.y.should.be.approximately(240, 40)
    })

    after(async function () {
        await this.client.windowHandleSize(windowSize.value)
    })
})
