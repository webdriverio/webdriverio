describe('main suite 1', () => {
    it('foobar test', () => {
        const browserName = browser.capabilities.browserName.replace('Headless', '').trim()
        browser.url('http://guinea-pig.webdriver.io/')
        expect($('#useragent')).toHaveTextContaining(browserName)
    })
})
