import assert from 'node:assert/strict'

describe('launcher result fixture', () => {
    it('passes', () => {})
    it('retries once before passing', function () {
        this.retries(1)
        assert.equal(this.test.currentRetry(), 1, 'intentional first-attempt failure')
    })
    it.skip('is skipped', () => {})
    it('fails', () => {
        assert.fail('intentional final failure')
    })
})
