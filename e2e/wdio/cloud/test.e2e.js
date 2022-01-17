describe('this browser session', () => {
    it('should run in SL', () => {
        expect(browser.options.hostname).toContain('saucelabs.com')
    })
})
