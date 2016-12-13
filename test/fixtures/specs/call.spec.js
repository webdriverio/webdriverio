describe('call command', () => {
    it('should not have a modified prototype', () => {
        const result = browser.call(() => ({ title: 'foobar' }))
        expect(result.title).to.be.equal('foobar')
        expect(result.click).to.be.equal(undefined)
    })
})
