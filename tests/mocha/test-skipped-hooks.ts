import assert from 'node:assert'

describe('Mocha smoke test to be skipped via wdio hooks', () => {
    it('should be skipped', async () => {
        assert.strictEqual(1, 2)
    })
})
