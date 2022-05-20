import assert from 'node:assert'

describe('Mocha smoke test', () => {
    describe('middleware', () => {
        it('should wait for elements if not found immediately', () => {
            browser.waitForElementScenario()
            const elem = $('elem')
            //Element will be found
            assert.doesNotThrow(() => elem.click())
        })

        it('should refetch stale elements', () => {
            browser.staleElementRefetchScenario()

            const elem = $('elem')
            elem.click()
            // element becomes stale
            elem.click()
        })
    })
})
