import { browser, expect } from '@wdio/globals'

describe('WebdriverIO', () => {
    it('should provide access to Puppeteer', async () => {
        const puppeteerInstance = await browser.getPuppeteer()
        expect(puppeteerInstance).toBeDefined()
    })
})
