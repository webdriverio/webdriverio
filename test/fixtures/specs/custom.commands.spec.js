describe('custom commands spec', () => {
    it('async custom commands should work sync', () => {
        browser.elementsCount('html').should.be.equal(1)
    })

    it('should work with transferPromiseness #1218', function async () {
        return browser
            .url('/')
            .waitForExist('body', 2000)
            .isExisting('body').should.eventually.be.true
            .elementsCount('html').should.eventually.equal(1)
    })
})
