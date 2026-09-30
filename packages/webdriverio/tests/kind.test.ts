import path from 'node:path'
import { describe, expect, test, vi } from 'vitest'

import {
    WDIO_KIND, getWdioKind, isBrowserKind, isElementKind, isElementArrayKind, isMultiRemoteKind, isChainableKind,
    multiRemote, remote
} from '../src/index.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

/**
 * The `wdio.kind` brand (#15812) on the objects that WebdriverIO creates.
 */
describe('WebdriverIO object brand', () => {
    test('browser, elements and element arrays', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const element = await browser.$('#foo')
        const elements = await browser.$$('#foo')

        expect(getWdioKind(browser)).toBe('browser')
        expect(getWdioKind(element)).toBe('element')
        expect(getWdioKind(elements)).toBe('element-array')
        expect(getWdioKind(elements[0])).toBe('element')
        expect(getWdioKind(await element.$('#bar'))).toBe('element')
        expect(getWdioKind(browser.$('#foo'))).toBe('chainable-element')
        expect(getWdioKind(await elements.filter(() => true))).toBe('element-array')
        expect(getWdioKind([...elements])).toBeUndefined()
    })

    test('element lists have the same kind before and after they resolve', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const pending = browser.$$('#foo')
        const chained = browser.$('#foo').$$('#bar')

        expect(getWdioKind(pending)).toBe('element-array')
        expect(WDIO_KIND in pending).toBe(true)
        expect(getWdioKind(chained)).toBe('element-array')
        expect(getWdioKind(await pending)).toBe('element-array')
        expect(getWdioKind(await chained)).toBe('element-array')
    })

    test('the brand is not enumerable', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const element = await browser.$('#foo')

        expect(WDIO_KIND in element).toBe(true)
        expect(Object.getOwnPropertySymbols(element)
            .filter((symbol) => Object.getOwnPropertyDescriptor(element, symbol)?.enumerable)).not.toContain(WDIO_KIND)
        expect(JSON.stringify(element)).not.toContain('kind')
    })

    test('multiremote browser, elements and element arrays', async () => {
        const browser = await multiRemote({
            browserA: { capabilities: { browserName: 'chrome' } },
            browserB: { port: 4445, capabilities: { browserName: 'firefox' } }
        })
        const elements = await browser.$$('#foo')

        expect(getWdioKind(browser)).toBe('multi-remote-browser')
        expect(getWdioKind(browser.getInstance('browserA'))).toBe('browser')
        expect(getWdioKind(browser.select('browserA'))).toBe('multi-remote-browser')
        expect(getWdioKind(await browser.$('#foo'))).toBe('multi-remote-element')
        expect(getWdioKind(elements)).toBe('multi-remote-element-array')
        expect(getWdioKind(elements[0])).toBe('multi-remote-element')
    })

    test('kind helpers on real objects', async () => {
        const browser = await remote({ capabilities: { browserName: 'foobar' } })
        const multiRemoteBrowser = await multiRemote({
            browserA: { capabilities: { browserName: 'chrome' } },
            browserB: { port: 4445, capabilities: { browserName: 'firefox' } }
        })

        expect(isBrowserKind(browser)).toBe(true)
        expect(isBrowserKind(multiRemoteBrowser)).toBe(true)
        expect(isMultiRemoteKind(multiRemoteBrowser)).toBe(true)
        expect(isMultiRemoteKind(browser)).toBe(false)

        expect(isElementKind(browser.$('#foo'))).toBe(true)
        expect(isElementKind(await browser.$('#foo'))).toBe(true)
        expect(isElementKind(await multiRemoteBrowser.$('#foo'))).toBe(true)
        expect(isElementKind(browser)).toBe(false)

        expect(isElementArrayKind(browser.$$('#foo'))).toBe(true)
        expect(isElementArrayKind(await multiRemoteBrowser.$$('#foo'))).toBe(true)
        expect(isElementArrayKind([...await browser.$$('#foo')])).toBe(false)

        expect(isChainableKind(browser.$('#foo'))).toBe(true)
        expect(isChainableKind(await browser.$('#foo'))).toBe(false)
        // a pending $$() is an element list, not a chainable, although it is thenable
        expect(isChainableKind(browser.$$('#foo'))).toBe(false)
        expect(isChainableKind(browser)).toBe(false)
    })
})
