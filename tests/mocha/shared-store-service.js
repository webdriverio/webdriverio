import assert from 'node:assert'

describe('Shared store service', () => {
    it('should get from shared store', async () => {
        const caps = await browser.sharedStore.get(browser.sessionId)
        assert.equal(caps.browserName, browser.capabilities.browserName)
    })

    it('should allow various types of values', async () => {
        await browser.sharedStore.set('boolean', true)
        await browser.sharedStore.set('number', 123)
        await browser.sharedStore.set('string', 'foobar')
        await browser.sharedStore.set('null', null)

        assert.equal(await browser.sharedStore.get('boolean'), true)
        assert.equal(await browser.sharedStore.get('number'), 123)
        assert.equal(await browser.sharedStore.get('string'), 'foobar')
        assert.equal(await browser.sharedStore.get('null'), null)
    })

    it('should be able to fetch all key/value pairs', async () => {
        const keys = Object.keys(await browser.sharedStore.get('*'))
        expect(keys).toEqual([
            browser.sessionId,
            'boolean', 'number', 'string', 'null'
        ])
    })
})
