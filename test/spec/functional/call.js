describe('call', () => {
    let isCalled = false

    before(function () {
        return this.client.call(() => {
            isCalled = true
        })
    })

    it('should have executed a function', () => {
        isCalled.should.be.true
    })
})
