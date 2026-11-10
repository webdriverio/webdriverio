import assert from 'node:assert'

describe('Shared store service', () => {
    it('should get from shared store', async () => {
        const caps = await browser.sharedStore.get(browser.sessionId)
        assert.equal(caps.browserName, browser.capabilities.browserName)
    })

    it('should be able to get values', async () => {
        assert.equal(await browser.sharedStore.getValueFromPool('availableUrls'), 'url01.com')
        assert.equal(await browser.sharedStore.getValueFromPool('availableUrls'), 'url02.com')
        assert.equal(await browser.sharedStore.get('testKey'), 'testValue')
    })

    it('should allow various types of values', async () => {
        await browser.sharedStore.set('boolean', true)
        await browser.sharedStore.set('number', 123)
        await browser.sharedStore.set('string', 'foobar')
        await browser.sharedStore.set('null', null)

        assert.equal(await browser.sharedStore.get('boolean'), true)
        assert.equal(await browser.sharedStore.get('number'), 123)
        assert.equal(await browser.sharedStore.get('string'), 'foobar')
        assert.strictEqual(await browser.sharedStore.get('null'), null)
    })

    it('should be able to fetch all key/value pairs', async () => {
        const keys = Object.keys(await browser.sharedStore.get('*'))
        expect(keys).toEqual([
            'testKey',
            browser.sessionId,
            'boolean', 'number', 'string', 'null'
        ])
    })

    it('should get values from a resource pool configured in hooks', async () => {
        const value1 = await browser.sharedStore.getValueFromPool('test-resource-pool')
        const value2 = await browser.sharedStore.getValueFromPool('test-resource-pool')
        const value3 = await browser.sharedStore.getValueFromPool('test-resource-pool')
        assert.equal(value1, 1)
        assert.equal(value2, 2)
        assert.equal(value3, 3)
    })

    it('should be able to add values and retrieve them from the resource pool', async () => {
        await browser.sharedStore.setResourcePool('2nd-pool', [])
        await browser.sharedStore.addValueToPool('2nd-pool', 3)
        await browser.sharedStore.addValueToPool('2nd-pool', 2)
        await browser.sharedStore.addValueToPool('2nd-pool', 1)
        const value1 = await browser.sharedStore.getValueFromPool('2nd-pool')
        const value2 = await browser.sharedStore.getValueFromPool('2nd-pool')
        const value3 = await browser.sharedStore.getValueFromPool('2nd-pool')
        assert.equal(value1, 3)
        assert.equal(value2, 2)
        assert.equal(value3, 1)
    })

    it('should keep keys that contain URL characters', async () => {
        for (const key of ['with/slash', 'with?query', 'with#hash', 'with%percent', 'with space']) {
            await browser.sharedStore.set(key, `value of ${key}`)
            assert.equal(await browser.sharedStore.get(key), `value of ${key}`)
            await browser.sharedStore.setResourcePool(key, [])
            await browser.sharedStore.addValueToPool(key, `pool value of ${key}`)
            assert.equal(await browser.sharedStore.getValueFromPool(key), `pool value of ${key}`)
        }
    })

    it('should return a null value from the resource pool', async () => {
        await browser.sharedStore.setResourcePool('null-pool', [null])
        assert.strictEqual(await browser.sharedStore.getValueFromPool('null-pool'), null)
    })
})
