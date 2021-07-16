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

    it('should also detect non PWAs', () => {
        browser.url('https://json.org')
        expect(browser.checkPWA().passed).toBe(false)
    })

    it('should allow to do performance tests', () => {
        browser.enablePerformanceAudits()
        browser.url('http://json.org')
        const metrics = browser.getMetrics()
        expect(typeof metrics.serverResponseTime).toBe('number')
        expect(typeof metrics.domContentLoaded).toBe('number')
        expect(typeof metrics.firstVisualChange).toBe('number')
        expect(typeof metrics.firstPaint).toBe('number')
        expect(typeof metrics.firstContentfulPaint).toBe('number')
        expect(typeof metrics.firstMeaningfulPaint).toBe('number')
        expect(typeof metrics.largestContentfulPaint).toBe('number')
        expect(typeof metrics.lastVisualChange).toBe('number')
        expect(typeof metrics.interactive).toBe('number')
        expect(typeof metrics.load).toBe('number')
        expect(typeof metrics.speedIndex).toBe('number')
        expect(typeof metrics.totalBlockingTime).toBe('number')
        expect(typeof metrics.maxPotentialFID).toBe('number')
        expect(typeof metrics.cumulativeLayoutShift).toBe('number')
        const score = browser.getPerformanceScore()
        expect(typeof score).toBe('number')
    })
})
