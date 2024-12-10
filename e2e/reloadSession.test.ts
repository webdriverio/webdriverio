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
    expect(typeof await browser.browsingContextGetTree({})).toBe('object')
    await browser.deleteSession()
})
