import { browser, expect } from '@wdio/globals'

describe('a component test in another window', () => {
    it('works in a popup for longer than one check of the runner', async () => {
        const testPage = await browser.getWindowHandle()
        window.open('about:blank', '_blank')
        await browser.waitUntil(async () => (await browser.getWindowHandles()).length === 2)
        const popup = (await browser.getWindowHandles()).find((handle) => handle !== testPage) as string
        await browser.switchToWindow(popup)

        // the runner checks the test page every 500 ms, not the popup
        await browser.pause(1500)
        expect(await browser.getTitle()).toBe('')

        await browser.closeWindow()
        expect(await browser.getWindowHandle()).toBe(testPage)
    })
})
