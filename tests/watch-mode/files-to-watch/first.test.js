import assert from 'node:assert/strict'

describe('filesToWatch', () => {
    it('reruns the first spec', async () => {
        await browser.url('http://watch-mode.test/files-to-watch/first')
        assert.equal(await browser.getTitle(), 'Watch mode')
    })
})
