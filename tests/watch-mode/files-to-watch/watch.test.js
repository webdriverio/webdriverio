import assert from 'node:assert/strict'

describe('filesToWatch', () => {
    it('reruns the complete suite', async () => {
        await browser.url('http://watch-mode.test/files-to-watch')
        assert.equal(await browser.getTitle(), 'Watch mode')
    })
})
