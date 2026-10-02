describe('this browser session', () => {
    it('should run in SL', () => {
        expect(browser.options.hostname).toContain('saucelabs.com')
    })

    it('can query shadow DOM with WebDriver', async () => {
        await browser.url('https://guinea-pig.webdriver.io/shadowDom.html')
        await $('h1').waitForDisplayed()
        await expect($('ul[slot="my-text"] li:last-child')).toHaveText('In a list!')
    })
})
