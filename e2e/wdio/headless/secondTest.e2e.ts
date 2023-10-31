import { browser, $, expect } from '@wdio/globals'

describe('main suite 1', () => {
    it('foobar test', async () => {
        const caps = browser.capabilities as WebdriverIO.Capabilities
        const assertionValue = caps.browserName === 'msedge'
            ? 'headlessedg'
            : caps.browserName && caps.browserName.includes('chrome') ? 'headlesschrome' : caps.browserName!.toLowerCase()
        await browser.url('http://guinea-pig.webdriver.io/')
        await expect((await $('#useragent').getText()).toLowerCase()).toContain(assertionValue)
    })
})
