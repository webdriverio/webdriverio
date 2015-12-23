describe('isVisibleWithinViewport', () => {
    it('should check if a single element is visible', async function () {
        (await this.client.isVisibleWithinViewport('.nested')).should.be.true;
        (await this.client.isVisibleWithinViewport('.notInViewport')).should.be.false
    })

    it('should check multiple elements are visible', async function () {
        const isVisibleWithinViewport = await this.client.isVisibleWithinViewport('.notInViewports')
        isVisibleWithinViewport.should.be.an.instanceOf(Array)
        isVisibleWithinViewport.should.have.length(2)
        isVisibleWithinViewport[0].should.be.equal(false)
        isVisibleWithinViewport[1].should.be.equal(true)
    })
})
