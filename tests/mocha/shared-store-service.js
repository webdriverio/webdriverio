import assert from 'assert'

describe('Shared store service', () => {
    it('should get from shared store', () => {
        const caps = browser.sharedStore.get(browser.sessionId)
        assert.equal(caps.browserName, browser.capabilities.browserName)
    })
})
