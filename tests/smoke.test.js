import assert from 'assert'

describe('smoke test', () => {
    it('should return sync value', () => {
        assert.equal(browser.getTitle(), 'Mock Page Title')
    })

    it('should wait for elements if not found immediately', () => {
        browser.waitForElementScenario()
        const elem = $('elem')
        assert.equal(elem.isDisplayed(), true)
    })

    it('should refetch elements', () => {
        browser.staleElementRefetchScenario()

        const elem = $('elem')
        elem.click()
        // element becomes stale
        elem.click()
    })
})
