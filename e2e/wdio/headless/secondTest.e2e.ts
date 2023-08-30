import { browser, $, expect } from '@wdio/globals'
import type { Capabilities } from '@wdio/types'

describe('main suite 1', () => {
    it('foobar test', async () => {
        const caps = browser.capabilities as Capabilities.Capabilities
        const assertionValue = caps.browserName === 'msedge'
            ? 'headlessedg'
            : caps.browserName!.toLowerCase()
        await browser.url('http://guinea-pig.webdriver.io/')
        await expect((await $('#useragent').getText()).toLowerCase()).toContain(assertionValue)
    })
})
