describe('main suite 1', () => {
    it('foobar test', async () => {
        const browserName = browser.capabilities.browserName.replace('Headless', '').trim()
        await browser.url('http://guinea-pig.webdriver.io/')
        await expect($('#useragent')).toHaveTextContaining(browserName)
    })

    it('should allow to check for PWA', async () => {
        await browser.url('https://webdriver.io')
        await browser.pause(100)
        expect((await browser.checkPWA()).passed).toBe(true)
    })

    it('should also detect non PWAs', async () => {
        await browser.url('https://json.org')
        expect((await browser.checkPWA()).passed).toBe(false)
    })

    it('should allow to do performance tests', async () => {
        await browser.enablePerformanceAudits()
        await browser.url('http://json.org')
        const metrics = await browser.getMetrics()
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
        const score = await browser.getPerformanceScore()
        expect(typeof score).toBe('number')
    })
})
