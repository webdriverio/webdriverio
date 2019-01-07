import assert from 'assert'

describe('smoke test', () => {
    it('should return sync value', () => {
        assert.equal(browser.getTitle(), 'Mock Page Title')
    })

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

    describe('isDisplayed', () => {
        it('should return false if element is never found', () => {
            browser.isNeverDisplayedScenario()
            const elem = $('elem')

            assert.equal(elem.isDisplayed(), false)
        })

        it('should reFetch the element once', () => {
            browser.isEventuallyDisplayedScenario()
            const elem = $('elem')

            assert.equal(elem.isDisplayed(), true)
        })
    })
})
