/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ELEMENT_KEY } from 'webdriver'

/**
 * jsdom has no layout, so the getVisibleText atom sees no text at all. Use a stand-in
 * that skips `display: none` like the atom, to run the comparison of the generated script.
 */
vi.mock('../../src/utils/thirdParty/getVisibleText.js', () => ({
    GET_VISIBLE_TEXT: `function getVisibleText (el) {
        const walk = (node) => node.nodeType === 3
            ? node.textContent
            : node.nodeType === 1 && getComputedStyle(node).display === 'none'
                ? ''
                : Array.from(node.childNodes).map(walk).join('')
        return walk(el)
    }`
}))

import { checkLinksMatchText } from '../../src/utils/elementChecks.js'

/**
 * runs the script in the page like `browser.execute`, with element references resolved
 */
const resolve = (arg: unknown): unknown => Array.isArray(arg)
    ? arg.map(resolve)
    : arg && typeof arg === 'object' && ELEMENT_KEY in arg
        ? document.getElementById((arg as Record<string, string>)[ELEMENT_KEY])
        : arg
const browser = {
    isBidi: false,
    execute: vi.fn((script: (...args: unknown[]) => unknown, ...args: unknown[]) => script(...args.map(resolve)))
} as unknown as WebdriverIO.Browser

describe('checkLinksMatchText', () => {
    beforeEach(() => {
        document.body.innerHTML = [
            '<a id="exact">Click me</a>',
            '<a id="padded">  Click me  </a>',
            '<a id="nested"><b>Click</b> me</a>',
            '<a id="hidden">Click me<span style="display:none"> later</span></a>',
            '<a id="longer">Click me now</a>',
            '<a id="other">Something else</a>'
        ].join('')
    })
    const ids = ['exact', 'padded', 'nested', 'hidden', 'longer', 'other']

    it('compares the trimmed rendered text with the value (link text)', async () => {
        expect(await checkLinksMatchText(browser, ids, 'link text', 'Click me')).toEqual([
            true, true, true, true, false, false
        ])
    })

    it('checks that the rendered text contains the value (partial link text)', async () => {
        expect(await checkLinksMatchText(browser, ids, 'partial link text', 'Click')).toEqual([
            true, true, true, true, true, false
        ])
        expect(await checkLinksMatchText(browser, ids, 'partial link text', 'later')).toEqual([
            false, false, false, false, false, false
        ])
    })

    it('uses the value it is given', async () => {
        expect(await checkLinksMatchText(browser, ids, 'link text', 'Something else')).toEqual([
            false, false, false, false, false, true
        ])
        expect(await checkLinksMatchText(browser, ids, 'link text', 'Click')).toEqual([
            false, false, false, false, false, false
        ])
    })

    it('falls back to one check per link if the batch fails', async () => {
        vi.mocked(browser.execute).mockRejectedValueOnce(new Error('stale element reference'))
        expect(await checkLinksMatchText(browser, ['exact', 'other'], 'link text', 'Click me')).toEqual([true, false])
    })
})
