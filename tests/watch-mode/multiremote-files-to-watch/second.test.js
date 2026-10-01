import assert from 'node:assert/strict'

describe('filesToWatch multiremote', () => {
    it('reruns the second spec on both browsers', async () => {
        await browser.browserA.url('http://watch-mode.test/multiremote-files-to-watch/second')
        await browser.browserB.url('http://watch-mode.test/multiremote-files-to-watch/second')
        const titleA = await browser.browserA.getTitle()
        const titleB = await browser.browserB.getTitle()
        assert.equal(titleA, 'Watch mode')
        assert.equal(titleB, 'Watch mode')
    })
})
