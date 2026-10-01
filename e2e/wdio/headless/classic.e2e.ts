import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { browser } from '@wdio/globals'
import scripts from './__fixtures__/script.js'

describe('savePDF on a classic session', () => {
    it('prints a PDF with printPage', async () => {
        expect(browser.isBidi).toBe(false)
        await browser.url('https://guinea-pig.webdriver.io/')

        const file = path.join(os.tmpdir(), `classic-save-pdf-${Date.now()}.pdf`)
        const pdf = await browser.savePDF(file, {
            orientation: 'landscape',
            left: 2
        })

        expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
        expect((await fs.readFile(file)).subarray(0, 5).toString()).toBe('%PDF-')
        await fs.rm(file, { force: true })
    })
})

describe('custom element list commands on a classic session', () => {
    const page = 'data:text/html,' + encodeURIComponent('<iframe srcdoc="<h1>Inner frame</h1>"></iframe>')

    before(() => {
        browser.addCommand('frames$$', function (this: WebdriverIO.Browser) {
            return this.$$('iframe')
        })
        browser.addLocatorStrategy('frames', () => Array.from(document.querySelectorAll('iframe')) as HTMLElement[])
    })

    afterEach(async () => {
        await browser.switchFrame(null)
    })

    it('switches to a frame via an item of the list', async () => {
        await browser.url(page)
        // @ts-expect-error custom command
        await browser.switchFrame(browser.frames$$()[0])
        await expect($('h1')).toHaveText('Inner frame')
    })

    it('switches to a frame via at() of the list', async () => {
        await browser.url(page)
        // @ts-expect-error custom command
        await browser.switchFrame(browser.frames$$().at(0))
        await expect($('h1')).toHaveText('Inner frame')
    })

    it('switches to a frame via the awaited find() of the list', async () => {
        await browser.url(page)
        // @ts-expect-error custom command
        await browser.switchFrame(await browser.frames$$().find(async (frame: WebdriverIO.Element) => await frame.getTagName() === 'iframe'))
        await expect($('h1')).toHaveText('Inner frame')
    })

    it('switches to a frame via an item of a custom$$ locator strategy query', async () => {
        await browser.url(page)
        await browser.switchFrame(browser.custom$$('frames', '')[0])
        await expect($('h1')).toHaveText('Inner frame')
    })
})

describe('__name polyfill', () => {
    it('suppports __name polyfill for classic sessions', async () => {
        await browser.url('https://guinea-pig.webdriver.io')
        expect(await browser.execute(scripts.someScript, 'foo')).toBe('Hello World! foo')
        expect(await browser.execute(scripts.someAsyncScript, 'foo')).toBe('Hello World! foo')
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
