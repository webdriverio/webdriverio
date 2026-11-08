import { browser, expect } from '@wdio/globals'

describe('browser.closeWindow in a component test', () => {
    it('closes the window and continues in the remaining window', async () => {
        const testPage = await browser.getWindowHandle()
        // the runner checks the focused window every 500 ms, and fails the spec if it is not a test page
        const opened = window.open('about:blank', '_blank') as Window
        opened.document.title = 'WebdriverIO Browser Test'
        // slow to close, so a check of the runner always runs in the popup while it closes
        opened.addEventListener('pagehide', () => {
            const end = Date.now() + 1200
            while (Date.now() < end) { /* busy */ }
        })
        await browser.waitUntil(async () => (await browser.getWindowHandles()).length === 2)
        const popup = (await browser.getWindowHandles()).find((handle) => handle !== testPage) as string
        await browser.switchToWindow(popup)

        await browser.closeWindow()

        expect(await browser.getWindowHandles()).toEqual([testPage])
        expect(await browser.getWindowHandle()).toBe(testPage)
    })
})
