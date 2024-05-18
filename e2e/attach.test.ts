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
            'goog:chromeOptions': {
                args: ['headless', 'disable-gpu']
            }
        }
    })

    await browser.url('http://guinea-pig.webdriver.io')
    expect(await browser.getTitle()).toBe('WebdriverJS Testpage')

    const otherBrowser = await attach(browser)
    expect(await otherBrowser.getTitle()).toBe('WebdriverJS Testpage')

    await otherBrowser.deleteSession()

    /**
     * verify that browser session is deleted
     */
    const error = await browser.status().catch((err) => err)
    expect(error.message).not.toBe('ChromeDriver ready for new sessions.')
    expect(error.message).toEqual(expect.stringContaining('fetch failed'))
})

test('can attach to a Bidi session', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'chrome',
            webSocketUrl: true,
            'goog:chromeOptions': {
                args: ['headless', 'disable-gpu']
            }
        }
    })

    const origContextTree = await browser.browsingContextGetTree({ maxDepth: 1 })
    expect(origContextTree.contexts).toHaveLength(1)
    expect(typeof origContextTree.contexts[0].context).toBe('string')

    const otherBrowser = await attach(browser)
    const newContextTree = await otherBrowser.browsingContextGetTree({ maxDepth: 1 })
    expect(origContextTree.contexts[0].context).toBe(newContextTree.contexts[0].context)

    await otherBrowser.deleteSession()

    /**
     * verify that browser session is deleted
     */
    const error = await browser.status().catch((err) => err)
    expect(error.message).not.toBe('ChromeDriver ready for new sessions.')
    expect(error.message).toEqual(expect.stringContaining('fetch failed'))
})
