import assert from 'assert'

describe('Mocha smoke test', () => {
    it('should be able to wait for an element', () => {
        browser.waitForDisplayedScenario()
        assert($('elem').waitForDisplayed(), true)
    })
})
