/// <reference types="@wdio/lighthouse-service" />
import { browser, expect } from '@wdio/globals'

describe('context management', () => {
    it('should switch between contexts when the window changes', async () => {
        await browser.url('http://guinea-pig.webdriver.io/')

        await browser.newWindow('https://webdriver.io')
        await expect($('.hero__subtitle')).toBePresent()
        await expect($('.red')).not.toBePresent()

        await browser.switchWindow('guinea-pig.webdriver.io')
        await expect($('.red')).toBePresent()
        await expect($('.hero__subtitle')).not.toBePresent()

        await browser.switchWindow('Next-gen browser and mobile automation test framework for Node.js')
        await expect($('.hero__subtitle')).toBePresent()
        await expect($('.red')).not.toBePresent()
    })

    async function switchToFrameBySelector(selector: string) {
        const iframe = await browser.findElement('css selector', selector)
        await browser.switchToFrame(iframe)
    }
    async function setAttribute(selector: string, attributeName: string, attributeValue: string) {
        await browser.execute((elementSelector, attributeName, attributeValue) => {
            const element = document.querySelector(elementSelector)
            if (element) {
                element.setAttribute(attributeName, attributeValue)
            }
        }, selector, attributeName, attributeValue)
    }

    it('should verify existence of the element within the iframe', async () => {
        await browser.url('http://guinea-pig.webdriver.io/pointer.html')

        await setAttribute('textarea', 'data-testid', 'parent document')
        await expect(browser.$('textarea[data-testid="parent document"]')).toExist()

        await switchToFrameBySelector('iframe.code-tabs__result')

        await expect(browser.$('textarea[data-testid="parent document"]')).not.toExist()
        await setAttribute('textarea', 'data-testid', 'child document')
        await expect(browser.$('textarea[data-testid="child document"]')).toExist()

        await browser.switchToParentFrame()

        await expect(browser.$('textarea[data-testid="parent document"]')).toExist()
    })

    it('should wait for the element to be displayed within the iframe', async () => {
        await browser.url('http://guinea-pig.webdriver.io/pointer.html')

        await setAttribute('textarea', 'data-testid', 'parent document')
        await expect(browser.$('textarea[data-testid="parent document"]')).toBeDisplayed()

        await switchToFrameBySelector('iframe.code-tabs__result')

        await expect(browser.$('textarea[data-testid="parent document"]')).not.toBeDisplayed()
        await setAttribute('textarea', 'data-testid', 'child document')
        await expect(browser.$('textarea[data-testid="child document"]')).toBeDisplayed()

        await browser.switchToParentFrame()

        await expect(browser.$('textarea[data-testid="parent document"]')).toBeDisplayed()
    })
})
