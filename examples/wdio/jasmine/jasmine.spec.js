describe('webdriver.io page', () => {
    it('should have the right title', () => {
        browser.url('http://webdriver.io')
        const title = browser.getTitle()
        expect(title).toBe('WebdriverIO - WebDriver bindings for Node.js')
    })
})
