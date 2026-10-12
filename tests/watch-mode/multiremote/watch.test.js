import assert from 'node:assert/strict'

describe('multi-remote watch mode', () => {
    it('reuses both browser sessions', async () => {
        await browser.url('http://watch-mode.test/first')
        const titles = await browser.getTitle()
        assert.deepEqual(titles, ['Watch mode', 'Watch mode'])
    })
})
