describe('isVisible', () => {
    it('should check if a single element is visible', async function () {
        (await this.client.isVisible('.searchinput')).should.be.true;
        (await this.client.isVisible('.invisible')).should.be.false
    })

    it('should check multiple elements are visible', async function () {
        const isVisible = await this.client.isVisible('.visibletest')
        isVisible.should.be.an.instanceOf(Array)
        isVisible.should.have.length(2)
        isVisible.should.contain(false)
    })
})
