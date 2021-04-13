describe('main suite 1', () => {
    it('foobar test', () => {
        const browserName = browser.capabilities.browserName.replace('Headless', '').trim()
        browser.url('http://guinea-pig.webdriver.io/')
        expect($('#useragent')).toHaveTextContaining(browserName)
    })

    it('should allow to check for PWA', () => {
        browser.url('https://webdriver.io')
        expect(browser.checkPWA().passed).toBe(true)
    })
})
