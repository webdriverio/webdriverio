import { browser, expect } from '@wdio/globals'

describe('browser.closeWindow in a component test', () => {
    it('closes the window and continues in the remaining window', async () => {
        const testPage = await browser.getWindowHandle()
        window.open('about:blank', '_blank')
        await browser.waitUntil(async () => (await browser.getWindowHandles()).length === 2)
        const popup = (await browser.getWindowHandles()).find((handle) => handle !== testPage) as string
        await browser.switchToWindow(popup)

        await browser.closeWindow()

        expect(await browser.getWindowHandles()).toEqual([testPage])
        expect(await browser.getWindowHandle()).toBe(testPage)
    })
})
