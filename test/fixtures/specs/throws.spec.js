describe('this spec', () => {
    it('should throw', () => {
        let start = new Date().getTime()

        try {
            browser.click('#notExisting')
        } catch (e) {}

        expect(new Date().getTime() - start).to.be.above(2000)
        expect(browser.lastError.message).to.be.equal(`Unable to find element with id 'notExisting'`)
    })
})
