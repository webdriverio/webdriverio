import os from 'node:os'
import { test, expect } from 'vitest'
/**
 * in order to run this file make sure you have `webdriverio`
 * installed using NPM before running it:
 *
 *   $ npm install webdriverio
 *
 */
import { remote, attach } from 'webdriverio'

test('allow to attach to an existing session', async () => {
    /**
     * fails in windows due to timeout:
     * > Command browsingContext.navigate with id 1 (with the following parameter: {"context":"BD746B5679530BC3403539C2FEC5A45A","url":"https://guinea-pig.webdriver.io","wait":"interactive"}) timed out
     */
    if (os.platform() === 'win32') {
        return
    }

    const browser = await remote({
        capabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': {
                args: ['headless', 'disable-gpu']
            }
        }
    })

    await browser.url('https://guinea-pig.webdriver.io')
    expect(await browser.getTitle()).toBe('WebdriverJS Testpage')
    const origContextTree = await browser.browsingContextGetTree({ maxDepth: 1 })
    expect(origContextTree.contexts).toHaveLength(1)
    expect(typeof origContextTree.contexts[0].context).toBe('string')

    const otherBrowser = await attach(browser)
    expect(await otherBrowser.getTitle()).toBe('WebdriverJS Testpage')
    const newContextTree = await otherBrowser.browsingContextGetTree({ maxDepth: 1 })
    expect(origContextTree.contexts[0].context).toBe(newContextTree.contexts[0].context)

    /**
     * can open other pages which requires e.g. network manager to be reinitialized correctly
     */
    await otherBrowser.url('https://guinea-pig.webdriver.io/two.html')
    expect(await otherBrowser.getTitle()).toBe('two')

    await otherBrowser.deleteSession()

    /**
     * verify that browser session is deleted
     */
    const error = await browser.status().catch((err) => err)
    expect(error.message).not.toBe('ChromeDriver ready for new sessions.')
    expect(error.message).toEqual(expect.stringContaining('Request failed with error code ECONNREFUSED'))
})
