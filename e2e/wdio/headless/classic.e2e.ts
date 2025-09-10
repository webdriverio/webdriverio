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
        await browser.url('https://the-internet.herokuapp.com/iframe')
        const elementalSeleniumLink = await $('/html/body/div[3]/div/div/a')
        await elementalSeleniumLink.waitForDisplayed()
        await elementalSeleniumLink.click()
        await browser.waitUntil(async () => (await browser.getWindowHandles()).length === 2)
        await browser.switchWindow('https://elementalselenium.com/')
        await $('#__docusaurus_skipToContent_fallback').waitForDisplayed()
        await browser.closeWindow()
        await $('#__docusaurus_skipToContent_fallback').waitForDisplayed({ reverse: true })
        await browser.waitUntil(async () => (await browser.getWindowHandles()).length === 1)
        await browser.switchWindow('https://the-internet.herokuapp.com/iframe')

        // Verify we're on the original window
        expect(await $('.example h3').getText()).toBe('An iFrame containing the TinyMCE WYSIWYG Editor')
    })
})
