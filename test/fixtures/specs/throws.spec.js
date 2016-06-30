describe('this spec', () => {
    it('should throw', () => {
        let start = new Date().getTime()

        try {
            browser.click('#notExisting')
        } catch (e) {}

        expect(new Date().getTime() - start).to.be.above(2000)
        expect(browser.lastError.message).to.be.equal(`An element could not be located on the page using the given search parameters.`)
    })
})
