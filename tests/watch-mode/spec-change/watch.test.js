import assert from 'node:assert/strict'

describe('watch mode', () => {
    it('reuses the browser session', async () => {
        await browser.url('http://watch-mode.test/first')
        assert.equal(await browser.getTitle(), 'Watch mode')
    })
})
