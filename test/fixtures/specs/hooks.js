describe('hook test', () => {
    it('should have executed beforeSession correctly', () => {
        expect(global.beforeSessionExecutionTime).to.be.greaterThan(500)
    })

    it('can change config properties', () => {
        expect(browser.options.foobar).to.be.equal('foobar')
    })

    it('can change capabilities', () => {
        expect(browser.desiredCapabilities.someOption).to.be.equal('test123')
    })
})
