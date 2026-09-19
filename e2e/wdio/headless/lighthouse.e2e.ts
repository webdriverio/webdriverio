/// <reference types="@wdio/lighthouse-service" />

import { browser, expect } from '@wdio/globals'

describe('Lighthouse service', () => {
    it('collects Lighthouse performance data for a page load', async () => {
        await browser.enablePerformanceAudits({
            networkThrottling: 'online',
            cpuThrottling: 1,
            cacheEnabled: true,
            formFactor: 'desktop'
        })

        await browser.url('https://guinea-pig.webdriver.io/')

        const metrics = await browser.getMetrics()
        expect(metrics.firstContentfulPaint).toEqual(expect.any(Number))
        expect(metrics.largestContentfulPaint).toEqual(expect.any(Number))
        expect(metrics.speedIndex).toEqual(expect.any(Number))
        expect(metrics.totalBlockingTime).toEqual(expect.any(Number))
        expect(metrics.cumulativeLayoutShift).toEqual(expect.any(Number))
        expect(metrics.serverResponseTime).toEqual(expect.any(Number))

        const score = await browser.getPerformanceScore()
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)

        const diagnostics = await browser.getDiagnostics()
        expect(diagnostics?.numRequests).toEqual(expect.any(Number))

        const breakdown = await browser.getMainThreadWorkBreakdown()
        expect(Array.isArray(breakdown)).toBe(true)

        await browser.disablePerformanceAudits()
    })

    it('captures trace logs and page weight', async () => {
        await browser.startTracing()
        await browser.url('https://guinea-pig.webdriver.io/')
        const traceLogs = await browser.endTracing()
        expect(Array.isArray(traceLogs)).toBe(true)
        expect(traceLogs.length).toBeGreaterThan(0)
        expect(traceLogs.some((event) => typeof event.name === 'string')).toBe(true)

        const storedLogs = await browser.getTraceLogs()
        expect(storedLogs).toEqual(traceLogs)

        const pageWeight = await browser.getPageWeight()
        expect(pageWeight.requestCount).toBeGreaterThan(0)
        expect(pageWeight.pageWeight).toEqual(expect.any(Number))
    })

    it('runs PWA checks without throwing', async () => {
        await browser.url('https://guinea-pig.webdriver.io/')
        const result = await browser.checkPWA(['viewport', 'appleTouchIcon'])
        expect(typeof result.passed).toBe('boolean')
        expect(result.details.viewport.score).toEqual(expect.any(Number))
    })
})
