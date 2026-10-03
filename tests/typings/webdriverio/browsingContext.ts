import { expectType } from 'tsd'
import type { FrameQuery } from 'webdriverio'

/**
 * Every member of `WebdriverIO.BrowsingContext`, called on a context.
 * `covered` at the bottom fails to compile when the interface gains a
 * member that has no check here.
 */
async function browsingContextTypes (browser: WebdriverIO.Browser) {
    const page = await browser.url('https://webdriver.io')
    expectType<WebdriverIO.BrowsingContext>(page)

    expectType<string>(page.contextId)
    expectType<string>(page.url)
    expectType<boolean>(page.isFrame)
    expectType<WebdriverIO.Browser>(page.browser)
    expectType<WebdriverIO.BrowsingContext | undefined>(page.parent)
    expectType<WebdriverIO.Request | undefined>(page.request)
    expectType<boolean>(page.isBidi)
    expectType<boolean>(page.isMobile)
    expectType<WebdriverIO.Capabilities>(page.capabilities)
    expectType<string>(page.sessionId)
    expectType<WebdriverIO.Browser['options']>(page.options)
    expectType<Map<string, unknown>>(page.strategies)

    /**
     * frames
     */
    const query: FrameQuery = { selector: '#payment' }
    expectType<WebdriverIO.BrowsingContext>(await page.frame(query))
    expectType<WebdriverIO.BrowsingContext>(await page.frame({ url: 'https://example.com/frame' }))
    expectType<WebdriverIO.BrowsingContext>(await page.frame({ url: /frame/ }))
    expectType<WebdriverIO.BrowsingContext>(await page.frame({ id: 'context-id' }))
    expectType<WebdriverIO.BrowsingContext>(await page.frame('iframe'))
    expectType<WebdriverIO.BrowsingContext>(await page.frame(page.$('iframe')))
    expectType<WebdriverIO.BrowsingContext>(await page.frame(({ url }) => url.includes('frame')))
    // @ts-expect-error a query takes one of selector, url or id
    await page.frame({ selector: 'iframe', url: 'https://example.com' })
    // @ts-expect-error `id` is a string
    await page.frame({ id: 42 })

    /**
     * elements and scripts
     */
    expectType<string>(await page.$('h1').getText())
    expectType<number>((await page.$$('li')).length)
    await page.custom$('strategy', 'arg')
    await page.custom$$('strategy', 'arg')
    await page.react$('Component')
    await page.react$$('Component')
    expectType<string>(await page.execute(() => document.title))
    expectType<number>(await page.execute((a: number, b: number) => a + b, 1, 2))
    await page.action('pointer').move({ x: 1, y: 1 }).perform()
    await page.actions([page.action('key').down('a').up('a')])
    await page.keys('abc')
    await page.keys(['a', 'b'])
    await page.scroll(0, 100)
    await page.waitUntil(async () => true)
    await page.pause(10)

    /**
     * navigation and document
     */
    expectType<WebdriverIO.BrowsingContext>(await page.navigate('/docs'))
    expectType<void>(await page.refresh())
    expectType<void>(await page.back())
    expectType<void>(await page.forward())
    expectType<void>(await page.activate())
    expectType<void>(await page.closeWindow())
    expectType<string>(await page.getTitle())
    expectType<string>(await page.getUrl())

    /**
     * dialogs
     */
    expectType<void>(await page.acceptAlert())
    expectType<void>(await page.acceptAlert('text'))
    expectType<void>(await page.dismissAlert())
    expectType<string>(await page.getAlertText())

    /**
     * capture and state
     */
    expectType<Buffer>(await page.saveScreenshot('./page.png'))
    expectType<Buffer>(await page.savePDF('./page.pdf'))
    await page.getCookies({ name: 'session' })
    await page.setCookies({ name: 'session', value: 'abc' })
    await page.deleteCookies({ name: 'session' })
    await page.setViewport({ width: 400, height: 600 })
    await page.addInitScript(() => {})
    await page.addInitScript((value: string, emit: (value: string) => void) => emit(value), 'arg')
    expectType<WebdriverIO.Mock>(await page.mock('**/api'))
    await page.mockClearAll()
    await page.mockRestoreAll()
    const restore = await page.emulate('userAgent', 'agent')
    await restore()
    await page.restore()
    await page.restore('userAgent')

    /**
     * events
     */
    page.on('dialog', () => {})
    page.off('dialog', () => {})
    page.once('dialog', () => {})
    page.emit('dialog')
    page.removeListener('dialog', () => {})
    page.removeAllListeners('dialog')
    expectType<Promise<never>>(page.addCommand('custom', () => {}))
    expectType<Promise<never>>(page.overwriteCommand('url', () => {}))

    const covered: Record<keyof WebdriverIO.BrowsingContext, true> = {
        contextId: true, url: true, isFrame: true, browser: true, parent: true, request: true,
        isBidi: true, isMobile: true, capabilities: true, sessionId: true, options: true, strategies: true,
        frame: true, $: true, $$: true, custom$: true, custom$$: true, react$: true, react$$: true,
        execute: true, action: true, actions: true, keys: true, scroll: true, waitUntil: true, pause: true,
        navigate: true, refresh: true, back: true, forward: true, activate: true, closeWindow: true,
        getTitle: true, getUrl: true, acceptAlert: true, dismissAlert: true, getAlertText: true,
        saveScreenshot: true, savePDF: true, getCookies: true, setCookies: true, deleteCookies: true,
        setViewport: true, addInitScript: true, mock: true, mockClearAll: true, mockRestoreAll: true,
        emulate: true, restore: true, on: true, off: true, once: true, emit: true, removeListener: true,
        removeAllListeners: true, addCommand: true, overwriteCommand: true
    }
    return covered
}

export default browsingContextTypes
