describe('main suite 1', () => {
    it('foobar test', async () => {
        const browserName = browser.capabilities.browserName.replace('Headless', '').trim()
        await browser.url('http://guinea-pig.webdriver.io/')
        await expect($('#useragent')).toHaveTextContaining(browserName)
    })
})
