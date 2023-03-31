describe('main suite 1', () => {
    it('foobar test', async () => {
        const browserName = browser.capabilities.browserName
        await browser.url('http://guinea-pig.webdriver.io/')
        await expect((await $('#useragent').getText()).toLowerCase()).toContain(browserName)
    })
})
