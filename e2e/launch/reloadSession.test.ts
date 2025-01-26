import { test, expect } from 'vitest'
/**
 * in order to run this file make sure you have `webdriverio`
 * installed using NPM before running it:
 *
 *   $ npm install webdriverio
 *
 */
import { remote } from 'webdriverio'

test('can reconnect to WebDriver Bidi session', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: ['headless', 'disable-gpu']
            }
        }
    })

    expect(typeof await browser.browsingContextGetTree({})).toBe('object')
    await browser.reloadSession()
    console.log('\n\nRESTARTED\n\n')

    expect(typeof await browser.browsingContextGetTree({})).toBe('object')
    await browser.url('https://guinea-pig.webdriver.io')
    expect(await browser.getTitle()).toBe('WebdriverJS Testpage')
    const h1 = await browser.$('h1')
    expect(await h1.getText()).toBe('WebdriverJS Testpage')
    await browser.deleteSession()
})
