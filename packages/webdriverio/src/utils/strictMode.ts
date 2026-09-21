import { getBrowserObject } from '@wdio/utils'
import isPlainObject from 'is-plain-obj'
import { ELEMENT_KEY } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'

import { DEEP_SELECTOR } from '../constants.js'
import { findElements, findDeepElements, isElement } from './index.js'
import { getShadowRootManager } from '../session/shadowRoot.js'
import type { ElementQueryOptions, Selector } from '../types.js'

/**
 * render a selector in a form that can be pasted back into a test
 */
function selectorToString (selector: Selector) {
    if (typeof selector === 'function') {
        return selector.toString()
    }
    return JSON.stringify(selector)
}

/**
 * Error thrown when `$` is used in strict mode (the default as of v10) and the
 * given selector resolves to more than one element.
 *
 * @see https://github.com/webdriverio/webdriverio/issues/15666
 */
export class StrictSelectorError extends Error {
    /**
     * amount of elements the selector resolved to
     */
    matches: number
    /**
     * selector that was used to query the elements
     */
    selector: Selector

    constructor (selector: Selector, matches: number) {
        const printable = selectorToString(selector)
        super(
            `strict mode violation: \`$(${printable})\` resolved to ${matches} elements, expected 1.\n` +
            `Use \`$$(${printable})\` to work with all matches, \`$$(${printable})[0]\` if you explicitly ` +
            'want the first one, or narrow down the selector so it matches a single element.\n' +
            `Opt out for a single call with \`$(${printable}, { strict: false })\` or globally by setting ` +
            '`strictSelectors: false` in your WebdriverIO config.'
        )
        this.name = 'StrictSelectorError'
        this.matches = matches
        this.selector = selector
    }
}

/**
 * Resolve whether a `$` call should behave strictly. Per call options win over
 * the `strictSelectors` config option which defaults to `true`.
 */
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

    return elems[0] || new Error(`Couldn't find element with selector "${String(selector)}"`)
}
