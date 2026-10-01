import assert from 'node:assert/strict'

describe('watch mode parallel multiremote', () => {
    it('reuses browser sessions', async () => {
        let firstBrowser, secondBrowser
        if (browser.browserA) {
            firstBrowser = browser.browserA
            secondBrowser = browser.browserB
        } else {
            firstBrowser = browser.browserC
            secondBrowser = browser.browserD
        }

        await firstBrowser.url('http://watch-mode.test/first')
        await secondBrowser.url('http://watch-mode.test/first')
        const titleFirst = await firstBrowser.getTitle()
        const titleSecond = await secondBrowser.getTitle()
        assert.equal(titleFirst, 'Watch mode')
        assert.equal(titleSecond, 'Watch mode')
    })
})
