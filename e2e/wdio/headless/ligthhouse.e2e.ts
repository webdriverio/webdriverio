/// <reference types="@wdio/lighthouse-service" />

import { browser, expect } from '@wdio/globals'

describe('Lighthouse service', () => {
    before(async () => {
        await browser.enablePerformanceAudits({
            networkThrottling: 'online',
            cpuThrottling: 1,
            cacheEnabled: true,
            formFactor: 'desktop'
        })
    })

    it('collects Lighthouse performance data', async () => {
        await browser.url('https://guinea-pig.webdriver.io/')

        const metrics = await browser.getMetrics()
        expect(metrics.firstContentfulPaint).toEqual(expect.any(Number))
        expect(metrics.largestContentfulPaint).toEqual(expect.any(Number))
        expect(metrics.speedIndex).toEqual(expect.any(Number))

        const score = await browser.getPerformanceScore()
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(1)
    })

    after(async () => {
        await browser.disablePerformanceAudits()
    })
})

// describe.only('Lighthouse Service Performance Testing capabilities', () => {
//     before(() => browser.enablePerformanceAudits())

//     it('should allow to do performance tests', async () => {
//         await browser.url('http://json.org')
//         const metrics = await browser.getMetrics()
//         expect(typeof metrics.serverResponseTime).toBe('number')
//         expect(typeof metrics.domContentLoaded).toBe('number')
//         expect(typeof metrics.firstVisualChange).toBe('number')
//         expect(typeof metrics.firstPaint).toBe('number')
//         expect(typeof metrics.firstContentfulPaint).toBe('number')
//         expect(typeof metrics.firstMeaningfulPaint).toBe('number')
//         expect(typeof metrics.largestContentfulPaint).toBe('number')
//         expect(typeof metrics.lastVisualChange).toBe('number')
//         expect(typeof metrics.interactive).toBe('number')
//         expect(typeof metrics.load).toBe('number')
//         expect(typeof metrics.speedIndex).toBe('number')
//         expect(typeof metrics.totalBlockingTime).toBe('number')
//         expect(typeof metrics.maxPotentialFID).toBe('number')
//         expect(typeof metrics.cumulativeLayoutShift).toBe('number')
//         const score = await browser.getPerformanceScore()
//         expect(typeof score).toBe('number')
//     })

//     after(() => browser.disablePerformanceAudits())
// })
