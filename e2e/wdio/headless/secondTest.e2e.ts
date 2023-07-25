import { browser, $ } from '@wdio/globals'

describe('main suite 1', () => {
    it('foobar test', async () => {
        const assertionValue = browser.capabilities.browserName === 'msedge'
            ? 'headlessedg'
            : browser.capabilities.browserName.toLowerCase()
        await browser.url('http://guinea-pig.webdriver.io/')
        await expect((await $('#useragent').getText()).toLowerCase()).toContain(assertionValue)
    })
})
