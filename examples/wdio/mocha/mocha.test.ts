import { browser, expect } from '@wdio/globals'

describe('webdriver.io page', () => {
    it('should be a pending test')

    it('should have the right title', async () => {
        await browser.url('https://webdriver.io')
        await expect(browser).toHaveTitle('WebdriverIO · Next-gen browser and mobile automation test framework for Node.js | WebdriverIO')
    })
})
