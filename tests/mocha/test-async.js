import assert from 'assert'

describe('Mocha smoke test', () => {
    it('should return sync value', async () => {
        const now = Date.now()
        assert.equal(await browser.getTitle(), 'Mock Page Title')
        const duration = Date.now() - now

        assert.equal(duration > 200, true)
    })
})
