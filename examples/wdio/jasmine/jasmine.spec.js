describe('webdriver.io page', () => {
    it('should have the right title', () => {
        browser.url('https://webdriver.io')
        expect(browser.getTitle())
            .toBe('WebdriverIO · Next-gen WebDriver test framework for Node.js')
    })
})
