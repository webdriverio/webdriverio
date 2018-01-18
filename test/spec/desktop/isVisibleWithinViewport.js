describe('isVisibleWithinViewport', () => {
    it.skip('should check if a single element is visible', async function () {
        (await this.client.isVisibleWithinViewport('.nested')).should.be.true;
        (await this.client.isVisibleWithinViewport('.notInViewport')).should.be.false
    })

    it.skip('should check multiple elements are not within the current viewport', async function () {
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

    it('should check that function returns false for an element that does not exist', async function () {
        /**
         * skip last test for IE because driver doesn't properly return error message of
         * execute script
         */
        if (this.client.desiredCapabilities.browserName === 'internet explorer') {
            return
        }

        const isVisibleWithinViewport = await this.client.isVisibleWithinViewport('#doesNotExist')
        isVisibleWithinViewport.should.be.equal(false)
    })
    
    it('should ignore dimension of element with position: static', async function () {
        const isVisibleWithinViewport = await this.client.scroll(0, 0).isVisibleWithinViewport('.noPosition.np-default .positionAbsolute')
        isVisibleWithinViewport.should.equal(true)
    })

    it('return true for position: static', async function () {
        const isVisibleWithinViewport = await this.client.scroll(0, 0).isVisibleWithinViewport('.noPosition.np-static .positionAbsolute')
        isVisibleWithinViewport.should.equal(true)
    })

    it('return false for static position and display: none', async function () {
        const isVisibleWithinViewport = await this.client.scroll(0, 0).isVisibleWithinViewport('.noPosition.np-display-none .positionAbsolute')
        isVisibleWithinViewport.should.equal(false)
    })

    it('return false for static position and visibility: hidden', async function () {
        const isVisibleWithinViewport = await this.client.scroll(0, 0).isVisibleWithinViewport('.noPosition.np-visibility-hidden .positionAbsolute')
        isVisibleWithinViewport.should.equal(false)
    })

    it('return false for static position and opacity: 0', async function () {
        const isVisibleWithinViewport = await this.client.scroll(0, 0).isVisibleWithinViewport('.noPosition.np-opacity-zero .positionAbsolute')
        isVisibleWithinViewport.should.equal(false)
    })

    it('return false for non-existent element', async function () {
        const isVisibleWithinViewport = await this.client.scroll(0, 0).isVisibleWithinViewport('.please-make-it-consistent')
        isVisibleWithinViewport.should.equal(false)
    })
})
