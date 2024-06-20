import { browser, $, expect } from '@wdio/globals'

describe('Launch Test', () => {
    it('should verify that right browser was initiated', async () => {
        const caps = browser.capabilities as WebdriverIO.Capabilities
        const assertionValue = caps.browserName!.includes('edge')
            ? 'headlessedg'
            : caps.browserName && caps.browserName.includes('chrome') ? 'chrome/' : caps.browserName!.toLowerCase()
        await browser.url('http://guinea-pig.webdriver.io/')
        await expect($('#useragent')).toHaveText(expect.stringContaining(assertionValue), { ignoreCase: true })

    // @ts-expect-error
    }, { retry: 2 })
})
