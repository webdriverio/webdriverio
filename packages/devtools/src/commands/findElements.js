/**
 * The Find Elements command is used to find elements
 * in the current browsing context that can be used for future commands.
 *
 * @alias browser.findElements
 * @see https://w3c.github.io/webdriver/#dfn-find-elements
 * @param {string} using  a valid element location strategy
 * @param {string} value  the actual selector that will be used to find an element
 * @return {object[]}     A (possibly empty) JSON list of representations of an element object.
 */

import { SUPPORTED_SELECTOR_STRATEGIES } from '../constants'
import { findElements as findElementsUtil } from '../utils'

export default async function findElements ({ using, value }) {
    if (!SUPPORTED_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    if (using === 'link text') {
        using = 'xpath'
        value = `//a[normalize-space() = "${value}"]`
    } else if (using === 'partial link text') {
        using = 'xpath'
        value = `//a[contains(., "${value}")]`
    }

    const page = this.getPageHandle(true)
    return findElementsUtil.call(this, page, using, value)
}
