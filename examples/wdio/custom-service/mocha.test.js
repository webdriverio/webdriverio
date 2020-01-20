describe('webdriver.io page', () => {
    it('should be a pending test')

    it('should have the right title', () => {
        browser.url('https://webdriver.io')
        expect(browser).toHaveTitle('WebdriverIO · Next-gen WebDriver test framework for Node.js')
    })
})
