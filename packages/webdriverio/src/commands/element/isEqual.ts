import { getBrowserObject, getWdioKind } from '@wdio/utils'

import { canFindAgain, findElementAgain } from '../../utils/findElementAgain.js'
import { isStaleElementToFindAgain } from '../../utils/index.js'
import { withKnownElement } from '../../utils/foreignContext.js'
import { StrictSelectorError } from '../../utils/strictSelectorError.js'

/**
 *
 * Return true if the selected element matches with the provided one.
 *
 * :::info
 *
 * As the other element commands, `isEqual` compares the elements that are on the page now. When the
 * page renders an element again (for example a React re-render), the command finds it again with its
 * selector, once and without a wait. An element that is gone is not equal.
 *
 * :::
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
        const [found, other] = await Promise.all([findOnPage(this), findOnPage(el)]).catch((lookupErr) => {
            // a strict-mode violation is a real error, as in the middleware
            if (lookupErr instanceof StrictSelectorError) {
                throw lookupErr
            }
            return [undefined, undefined]
        })
        if (!found?.elementId || !other?.elementId) {
            return false
        }
        return isSameNode(browser, found, other).catch(() => false)
    }
}

/**
 * Find the chain again from the browser, once, without a wait: a stale parent waits for itself,
 * and in BiDi finds its removed child. Keeps an element reference. `undefined` when one is gone.
 */
async function findOnPage (element: WebdriverIO.Element) {
    const chain: WebdriverIO.Element[] = []
    for (let current = element; getWdioKind(current) === 'element'; current = current.parent as WebdriverIO.Element) {
        chain.unshift(current)
    }
    let parent = chain[0]?.parent as WebdriverIO.Browser | WebdriverIO.Element
    for (const item of chain) {
        const found = canFindAgain(item) ? await findElementAgain(item, { parent }) : item
        if (!found?.elementId) {
            return undefined
        }
        parent = found
    }
    return parent as WebdriverIO.Element
}

/**
 * Whether 2 elements are the same node, after the stale check of both
 */
function isSameNode (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, el1: WebdriverIO.Element, el2: WebdriverIO.Element) {
    return (browser as WebdriverIO.Browser).execute(
        withKnownElement(
            /* istanbul ignore next */
            function isSameElement (el1: HTMLElement, el2: HTMLElement) {
                return el1 === el2
            }, [0, 1]),
        el1 as unknown as HTMLElement, el2 as unknown as HTMLElement)
}
