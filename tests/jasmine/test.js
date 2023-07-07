import assert from 'node:assert'

describe('Jasmine smoke test', () => {
    it('should allow sync matchers', () => {
        const test = 123
        expect(test).toBe(123)
    })

    it('should support sync Jest and Jasmine matchers', () => {
        expect(1).toBe(1) // available in both
        expect({ foo: 'bar' }).toEqual({ foo: 'bar' }) // Jest matcher
        expect(false).toBeFalse() // Jasmine matcher
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

    describe('support for addMatcher', () => {
        beforeAll(() => {
            jasmine.addMatchers({
                testMatcher: function testMatcher(/*matcherUtils*/) {
                    return {
                        compare: function compare(/*actual, expected*/) {
                            return { pass: true, message: 'Just good vibes.' }
                        }
                    }
                }
            })
        })

        it('should provide the custom matcher', () => {
            const customMatcher = expect(1).testMatcher
            expect(customMatcher).toBeDefined()
            expect(customMatcher).toBeInstanceOf(Function)
        })
    })
})
