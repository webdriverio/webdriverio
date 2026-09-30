import os from 'node:os'

import { remote } from '../../packages/webdriverio/build/index.js'

const browser = await remote({
    logLevel: 'error',
    capabilities: {
        webSocketUrl: true,
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu', ...(os.platform() === 'linux' ? ['no-sandbox'] : [])]
        }
    }
})

try {
    const firstUrl = 'https://webdriver.io/'
    const secondUrl = 'https://webdriver.io/docs/gettingstarted'
    await browser.url(firstUrl)
    const first = await browser.getUrl()
    await browser.url(secondUrl)
    const second = await browser.getUrl()

    await browser.back()
    const afterBack = await browser.getUrl()
    console.log('after back:', afterBack)
    if (new URL(afterBack).pathname !== new URL(first).pathname) {
        throw new Error(`back: expected ${first} but got ${afterBack}`)
    }

    await browser.forward()
    const afterForward = await browser.getUrl()
    console.log('after forward:', afterForward)
    if (new URL(afterForward).pathname !== new URL(second).pathname) {
        throw new Error(`forward: expected ${second} but got ${afterForward}`)
    }

    const original = await browser.getWindowHandle()
    const { context } = await browser.browsingContextCreate({ type: 'tab' })
    await browser.switchToWindow(context)
    try {
        await browser.back()
        throw new Error('back() on an empty history should reject')
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.log('empty history back:', message)
        if (!message.includes('no such history entry')) {
            throw err
        }
    } finally {
        await browser.closeWindow()
        await browser.switchToWindow(original)
    }
} finally {
    await browser.deleteSession()
}
