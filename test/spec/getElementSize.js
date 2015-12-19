describe('getElementSize', () => {
    it('should return a the size of an element', async function () {
        const size = await this.client.getElementSize('.overlay')
        size.width.should.be.equal(100)
        size.height.should.be.equal(50)
    })

    it('should return certain property width if set', async function () {
        const width = await this.client.getElementSize('.overlay', 'width')
        width.should.be.equal(100)
    })

    it('should return certain property height if set', async function () {
        const height = await this.client.getElementSize('.overlay', 'height')
        height.should.be.equal(50)
    })
})
