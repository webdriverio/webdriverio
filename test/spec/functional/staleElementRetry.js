describe('staleElementRetry', () => {
    describe('basic command', () => {
        it('does not throw staleElementReference exception when getting visibility of elements rapidly removed from DOM', async function () {
            let iterations = 100
            while (iterations--) {
                (await this.client.isVisible('.staleElementContainer1 .stale-element-container-row')).should.be.true
            }
        })
    })
})
