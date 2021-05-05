/**
 * in order to run this file make sure you have `webdriverio`
 * installed using NPM before running it:
 *
 *   $ npm install webdriverio
 *
 */
import { remote, attach } from '../../packages/webdriverio'

let browser
let testWasRun = false

test('allow to attach to an existing session', async () => {
    /**
     * don't retry passing tests - this is a bit weird behavior of jest
     * even if test passes the test is being re-run which causes the attach
     * command to fail with a weird error
     */
    if (testWasRun) {
        return
    }

    browser = await remote({
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
    testWasRun = true
})
