import assert from 'node:assert'

describe('smoke test multiremote filter caps', () => {
    it('should have one instance', async () => {
        assert.equal(browser.instances.length, 1)
    })
})
