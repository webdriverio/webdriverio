import assert from 'node:assert'

describe('Jasmine smoke test to be skipped via wdio hooks', () => {
    it('should be skipped', async () => {
        assert.strictEqual(1, 2)
    })
})
