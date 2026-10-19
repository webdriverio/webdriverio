import { getBrowserObject } from '@wdio/utils'

import { findElementAgain } from '../../utils/findElementAgain.js'
import { isStaleElementToFindAgain } from '../../utils/index.js'
import { withKnownElement } from '../../utils/foreignContext.js'

/**
 *
 * Return true if the selected element matches with the provided one.
 *
 * <example>
    :isEqual.js
    it('should detect if an element is clickable', async () => {
        const el = await $('#el')
        const sameEl = await $('#el')
        const anotherEl = await $('#anotherEl')

        el.isEqual(sameEl) // outputs: true

        el.isEqual(anotherEl) // outputs: false
    });
 * </example>
 *
 * @alias element.isEqual
 * @param   {Element}   el element to compare with
 * @return  {Boolean}   true if elements are equal
 *
 */
export async function isEqual (
    this: WebdriverIO.Element,
    el: WebdriverIO.Element
) {
    const browser = getBrowserObject(this)

    // mobile native
    if (browser.isMobile) {
        /**
         * some Appium platforms don't support the `getContext` method, in that case
         * we can't determine if we are in a native context or not, so we return undefined
         */
        const context = await browser.getContext().catch(() => undefined)
        const contextId = typeof context === 'string'
            ? context
            : context?.id

        if (contextId && contextId.toLowerCase().includes('native')) {
            return this.elementId === el.elementId
        }
    }

    // browser or webview
    try {
        return await isSameNode(browser, this, el)
    } catch (err) {
        if (!isStaleElementToFindAgain(err)) {
            return false
        }
        /**
         * The page rendered an element again: compare the elements that are on the page now. As
         * the other checks, look them up once, without a wait: an element that is gone is not equal.
         */
        const [found, other] = await Promise.all([findElementAgain(this), findElementAgain(el)])
            .catch(() => [undefined, undefined])
        if (!found?.elementId || !other?.elementId) {
            return false
        }
        return isSameNode(browser, found, other).catch(() => false)
    }
}

/**
 * Whether 2 elements are the same node, after the stale check of both
 */
function isSameNode (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, el1: WebdriverIO.Element, el2: WebdriverIO.Element) {
    return (browser as WebdriverIO.Browser).execute(
        withKnownElement(withKnownElement(
            /* istanbul ignore next */
            function isSameElement (el1: HTMLElement, el2: HTMLElement) {
                return el1 === el2
            }, 1)),
        el1 as unknown as HTMLElement, el2 as unknown as HTMLElement)
}
