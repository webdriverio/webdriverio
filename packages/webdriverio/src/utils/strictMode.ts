import { getBrowserObject } from '@wdio/utils'
import isPlainObject from 'is-plain-obj'
import { ELEMENT_KEY } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'

import { DEEP_SELECTOR } from '../constants.js'
import { findElements, findDeepElements, isElement, buildNotFoundError } from './index.js'
import { getShadowRootManager } from '../session/shadowRoot.js'
import { StrictSelectorError } from './strictSelectorError.js'
import type { ElementQueryOptions, Selector } from '../types.js'

/**
 * re-exported for backwards compatibility - moved to its own leaf module so
 * that leaf utilities like `implicitWait.ts` can check `instanceof
 * StrictSelectorError` without pulling in this module's `findElements` /
 * `findDeepElements` imports, which transitively close a circular import back
 * onto `refetchElement.ts` / `implicitWait.ts` themselves.
 */
export { StrictSelectorError }

export function isStrictQuery (
    scope: WebdriverIO.Browser | WebdriverIO.Element,
    options?: ElementQueryOptions
) {
    if (options && typeof options.strict === 'boolean') {
        return options.strict
    }

    const { strictSelectors } = getBrowserObject(scope).options || {}
    return strictSelectors !== false
}

/**
 * Selectors that can't resolve to more than one element are exempt from the
 * strictness check, e.g. element references returned by `getActiveElement` or
 * `HTMLElement`s handed over from the browser runner.
 */
export function isCountableSelector (selector: Selector) {
    if (typeof selector === 'string' || typeof selector === 'function') {
        return true
    }

    /**
     * `HTMLElement`s handed over from the browser runner always represent a
     * single node
     */
    if (isElement(selector)) {
        return false
    }

    if (!isPlainObject(selector)) {
        return false
    }

    /**
     * element references, e.g. the result of `browser.getActiveElement()`
     */
    if (typeof (selector as ElementReference)[ELEMENT_KEY] === 'string') {
        return false
    }

    /**
     * custom locator strategies and mobile matcher objects can resolve to
     * multiple elements and therefore are subject to strictness
     */
    return true
}

/**
 * Query a single element while asserting that the selector only matches one
 * element. Contrary to `findElement` this goes through the "find elements"
 * code path as that is the only way to know how many elements match.
 *
 * @param  selector selector to query
 * @return the single matching element reference or an error if nothing matched
 */
export async function findStrictElement (
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector
): Promise<ElementReference | Error> {
    const browserObject = getBrowserObject(this)
    const shadowRootManager = getShadowRootManager(browserObject)

    /**
     * pick the same lookup path `findElement` would have picked, just in its
     * "find elements" flavor, so strict mode doesn't change which elements a
     * selector resolves to - only how many of them are accepted
     */
    const elems = this.isBidi && typeof selector === 'string' && !selector.startsWith(DEEP_SELECTOR) && !shadowRootManager.isWithinFrame()
        ? await findDeepElements.call(this, selector)
        : await findElements.call(this, selector)

    if (elems.length > 1) {
        throw new StrictSelectorError(selector, elems.length)
    }

    return elems[0] || buildNotFoundError(selector)
}
