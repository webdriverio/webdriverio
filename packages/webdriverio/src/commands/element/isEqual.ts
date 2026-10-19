import { getBrowserObject } from '@wdio/utils'

import { findChainAgain } from '../../utils/findChainAgain.js'
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
 * selector, once and without a wait. An element that is gone is not equal. A strict element that
 * matches more than once then throws a `StrictSelectorError`, as the other checks do.
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
         * The page rendered an element again: compare the elements that are on the page now. Find
         * again only a stale element, as a valid one can match another node now. As the other
         * checks, look them up once, without a wait: an element that is gone is not equal.
         */
        const onPage = async (element: WebdriverIO.Element) => (
            await isKnown(browser, element) ? element : findChainAgain(element)
        )
        const lookups = await Promise.allSettled(el === this ? [onPage(this)] : [onPage(this), onPage(el)])
        const lookupErrs = lookups.flatMap((lookup) => lookup.status === 'rejected' ? [lookup.reason] : [])
        // a strict-mode violation is a real error, as in the middleware, also when the other lookup fails first
        const strictErr = lookupErrs.find((lookupErr) => lookupErr instanceof StrictSelectorError)
        if (strictErr) {
            throw strictErr
        }
        if (lookupErrs.length) {
            return false
        }
        const [found, otherFound] = lookups.map((lookup) => (lookup as PromiseFulfilledResult<WebdriverIO.Element | undefined>).value)
        const other = el === this ? found : otherFound
        if (!found?.elementId || !other?.elementId) {
            return false
        }
        return isSameNode(browser, found, other).catch(() => false)
    }
}

/**
 * Whether the element is still on the page; a stale element error gives `false`
 */
function isKnown (browser: WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser, element: WebdriverIO.Element) {
    return (browser as WebdriverIO.Browser).execute(withKnownElement(() => true), element as unknown as HTMLElement)
        .then(() => true, (err) => {
            if (isStaleElementToFindAgain(err)) {
                return false
            }
            throw err
        })
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
