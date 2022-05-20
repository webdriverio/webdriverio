import assert from 'node:assert'

describe('Shared store service', () => {
    it('should get from shared store', () => {
        const caps = browser.sharedStore.get(browser.sessionId)
        assert.equal(caps.browserName, browser.capabilities.browserName)
    })

    it('should allow various types of values', () => {
        browser.sharedStore.set('boolean', true)
        browser.sharedStore.set('number', 123)
        browser.sharedStore.set('string', 'foobar')
        browser.sharedStore.set('null', null)

        assert.equal(browser.sharedStore.get('boolean'), true)
        assert.equal(browser.sharedStore.get('number'), 123)
        assert.equal(browser.sharedStore.get('string'), 'foobar')
        assert.equal(browser.sharedStore.get('null'), null)
    })
})
