describe('isVisibleWithinViewport', () => {
    it('should check if a single element is visible', async function () {
        (await this.client.isVisibleWithinViewport('.nested')).should.be.true;
        (await this.client.isVisibleWithinViewport('.notInViewport')).should.be.false
    })

    it('should check multiple elements are not within the current viewport', async function () {
        const isVisibleWithinViewport = await this.client.isVisibleWithinViewport('.notInViewports')
        isVisibleWithinViewport.should.be.an.instanceOf(Array)
        isVisibleWithinViewport.should.have.length(2)
        isVisibleWithinViewport[0].should.be.equal(false)
        isVisibleWithinViewport[1].should.be.equal(false) // element is not inside the viewport
    })

    it('should check that element is inside the viewport when it is', async function () {
        const isVisibleWithinViewport = await this.client.scroll('.notInViewports').isVisibleWithinViewport('.notInViewports')
        isVisibleWithinViewport.should.be.an.instanceOf(Array)
        isVisibleWithinViewport.should.have.length(2)
        isVisibleWithinViewport[0].should.be.equal(false)
        isVisibleWithinViewport[1].should.be.equal(true) // this element is now within the viewport
    })

    it('should check that elements just outside the viewport are hidden', async function () {
        const isVisibleWithinViewport = await this.client.scroll(0, 0).isVisibleWithinViewport('.viewportTest')
        isVisibleWithinViewport.should.be.an.instanceOf(Array)
        isVisibleWithinViewport.should.have.length(4)
        isVisibleWithinViewport[0].should.equal(false)
        isVisibleWithinViewport[1].should.equal(false)
        isVisibleWithinViewport[2].should.equal(false)
        isVisibleWithinViewport[3].should.equal(false)
    })
})
