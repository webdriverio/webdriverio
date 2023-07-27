import { describe, it } from 'mocha'
import { Browser } from 'puppeteer-core'

import { browser } from '../../../packages/wdio-globals/build/index.js'

describe('WebdriverIO', () => {
    it('should provide access to Puppeteer', async () => {
        const puppeteerInstance = await browser.getPuppeteer()

        expect(puppeteerInstance).toBeInstanceOf(Browser)
    })
})
