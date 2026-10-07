import { browser } from '@wdio/globals'
import scripts from './__fixtures__/script.js'

describe('__name polyfill', () => {
    it('suppports __name polyfill for classic sessions', async () => {
        await browser.url('https://guinea-pig.webdriver.io')
        expect(await browser.execute(scripts.someScript, 'foo')).toBe('Hello World! foo')
        expect(await browser.executeAsync(scripts.someAsyncScript, 'foo')).toBe('Hello World! foo')
    })
})

describe('handle windows in webdriver classic', () => {
    it('should handle window closing and switching in WebDriver Classic mode', async () => {
        await browser.url('https://guinea-pig.webdriver.io/window.html')
        const openWindowLink = await $('#openWindow')
        await openWindowLink.waitForDisplayed()
        await openWindowLink.click()
        await browser.waitUntil(async () => (await browser.getWindowHandles()).length === 2)
        await browser.switchWindow('https://guinea-pig.webdriver.io/windowTarget.html')
        await $('#windowTarget').waitForDisplayed()
        await browser.closeWindow()
        await $('#windowTarget').waitForDisplayed({ reverse: true })
        await browser.waitUntil(async () => (await browser.getWindowHandles()).length === 1)
        await browser.switchWindow('https://guinea-pig.webdriver.io/window.html')

        // Verify we're on the original window
        expect(await $('h1').getText()).toBe('Window Demo')
    })
})
