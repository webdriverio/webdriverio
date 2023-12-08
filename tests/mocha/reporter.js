import assert from 'node:assert'

describe('my feature', () => {
    beforeEach(() => {})
    afterEach(() => {})

    it('should do stuff', async () => {
        assert.equal(await browser.getTitle(), 'Mock Page Title')
        await expect(browser).toHaveTitle('Mock Page Title')
    })
})
