import assert from 'node:assert'

describe('smoke test multi-remote filter caps', () => {
    it('should have two instances', async () => {
        assert.equal(browser.instances.length, 2)
    })
})
