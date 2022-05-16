import { SUPPORTED_SELECTOR_STRATEGIES } from '../constants.js'
import { findElement as findElementUtil } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver'

/**
 * The Find Element command is used to find an element in the current browsing context
 * that can be used for future commands.
 *
 * @alias browser.findElement
 * @see https://w3c.github.io/webdriver/#dfn-find-element
 * @param {string} using  a valid element location strategy
 * @param {string} value  the actual selector that will be used to find an element
 * @return {Object}       A JSON representation of an element object.
 */
export default function findElement (
    this: DevToolsDriver,
    { using, value }: { using: string, value: string }
) {
    if (!SUPPORTED_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    if (using === 'link text') {
        using = 'xpath'
        value = `//a[normalize-space() = "${value}"]`
    } else if (using === 'partial link text') {
        using = 'xpath'
        value = `//a[contains(., "${value}")]`
    } else if (using === 'shadow') {
        /**
         * `shadow/<selector>` is the way query-selector-shadow-dom
         * understands to query for shadow elements
         */
        using = 'css'
        value = `shadow/${value}`
    }

    const page = this.getPageHandle(true)
    return findElementUtil.call(this, page, using, value)
}
