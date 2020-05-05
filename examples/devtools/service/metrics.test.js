let metrics, score

describe('My Performance Test', () => {
    before(() => {
        /**
         * enable performance audits for all upcoming page loads
         */
        browser.enablePerformanceAudits()

        /**
         * open app
         */
        browser.url('/')

        /**
         * capture metrics for last page load
         */
        metrics = browser.getMetrics()
        score = browser.getPerformanceScore()
    })

    it('should not increase firstMeaningfulPaint limit', () => {
        expect(metrics.firstMeaningfulPaint).toBeLessThan(3 * 1000) // 3 seconds
    })

    it('should not increase firstInteractive limi', function () {
        expect(metrics.firstInteractive).toBeLessThan(3 * 1000) // 3 seconds
    })

    it('should not increase speedIndex limit', () => {
        expect(metrics.speedIndex).toBeLessThan(4.2 * 1000)
    })

    it('should have a minimum Lighthouse performance score', () => {
        expect(score).toBeGreaterThan(0.92)
    })
})
