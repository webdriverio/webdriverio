import assert from 'node:assert'

describe('Jasmine smoke test', () => {
    it('should allow sync matchers', () => {
        const test = 123
        expect(test).toBe(123)
    })

    it('should return async value', async () => {
        await browser.isEventuallyDisplayedScenario()
        await expect(browser).toHaveTitle('Mock Page Title')
        await expect($('foo')).toBeDisplayed()

        browser.isEventuallyDisplayedScenario()
        const elem = $('foo')
        await expect(elem).toBeDisplayed()
    })

    it('should allow sync assertion in async context', async () => {
        const test = 123
        expect(test).toBe(123)
    })

    let hasRun = false
    it('should retry', function () {
        if (!hasRun) {
            hasRun = true
            assert.equal(this.wdioRetries, 0)
            throw new Error('booom!')
        }

        expect(this.wdioRetries).toBe(1)
    }, jasmine.DEFAULT_TIMEOUT_INTERVAL, 1)
})
