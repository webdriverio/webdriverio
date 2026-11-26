import assert from 'node:assert/strict'

const hasTopLevelBrowserStub = Boolean(typeof browser !== 'undefined' && browser && browser.isChrome)
if (hasTopLevelBrowserStub) {
    browser.addCommand('watchStubCommand', async () => 'stub-transferred')
}

describe('watch mode', () => {
    it('reuses the browser session', async () => {
        assert.equal(hasTopLevelBrowserStub, true, 'browser protocol stub must be available on watch reruns')
        assert.equal(await browser.watchStubCommand(), 'stub-transferred')
        await browser.url('http://watch-mode.test/first')
        assert.equal(await browser.getTitle(), 'Watch mode')
    })
})
