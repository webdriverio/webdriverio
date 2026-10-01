import assert from 'node:assert/strict'

describe('filesToWatch', () => {
    it('reruns the second spec', async () => {
        await browser.url('http://watch-mode.test/files-to-watch/second')
        assert.equal(await browser.getTitle(), 'Watch mode')
    })
})
