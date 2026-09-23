import assert from 'node:assert/strict'

describe('watch mode multiremote', () => {
    it('reuses both browser sessions', async () => {
        await browser.browserA.url('http://watch-mode.test/first')
        await browser.browserB.url('http://watch-mode.test/first')
        const titleA = await browser.browserA.getTitle()
        const titleB = await browser.browserB.getTitle()
        assert.equal(titleA, 'Watch mode')
        assert.equal(titleB, 'Watch mode')
    })
})
