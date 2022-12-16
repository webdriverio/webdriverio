import { test, expect } from 'vitest'
/**
 * in order to run this file make sure you have `webdriverio`
 * installed using NPM before running it:
 *
 *   $ npm install webdriverio
 *
 */
import { remote, attach } from '../packages/webdriverio/build/index.js'

test('allow to attach to an existing session', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'chrome',
            'wdio:devtoolsOptions': { headless: true, dumpio: true }
        }
    })

    await browser.url('http://guinea-pig.webdriver.io')
    expect(await browser.getTitle()).toBe('WebdriverJS Testpage')

    const otherBrowser = await attach(browser)
    expect(await otherBrowser.getTitle()).toBe('WebdriverJS Testpage')

    await otherBrowser.deleteSession()
})
