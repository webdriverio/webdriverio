/**
 * in order to run this file make sure you have `webdriverio`
 * installed using NPM before running it:
 *
 *   $ npm install webdriverio
 *
 */
import { remote, attach } from '../../packages/webdriverio'

let browser

test('allow to attach to an existing session', async () => {
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
})
