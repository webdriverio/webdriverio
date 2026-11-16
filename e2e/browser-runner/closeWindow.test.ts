import { browser, expect } from '@wdio/globals'

describe('browser.closeWindow in a component test', () => {
    it('closes the window and continues in the remaining window', async () => {
        const testPage = await browser.getWindowHandle()
        const opened = window.open('about:blank', '_blank') as Window
        // closeWindow() runs this listener, so the popup needs 1.2 s to close and a check of the
        // runner (every 500 ms) always runs during the close: it must read the test page, not the popup
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
