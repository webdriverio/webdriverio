/**
 * in order to run this file make sure you have `webdriverio`
 * installed using NPM before running it:
 *
 *   $ npm install webdriverio
 *
 */
import { remote, attach } from '../../packages/webdriverio'

let browser;

(async () => {
    browser = await remote({
        capabilities: {
            browserName: 'chrome'
        }
    })

    await browser.url('http://guinea-pig.webdriver.io')
    expect(await browser.getTitle()).toBe('WebdriverJS Testpage')

    const otherBrowser = await attach(browser)
    expect(await otherBrowser.getTitle()).toBe('WebdriverJS Testpage')

    await otherBrowser.deleteSession()
})().catch(async (e) => {
    console.error(e)
    await browser.deleteSession()
})
