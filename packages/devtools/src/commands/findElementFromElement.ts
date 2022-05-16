import { SUPPORTED_SELECTOR_STRATEGIES } from '../constants.js'
import { findElement, getStaleElementError } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver'

/**
 * The Find Element From Element command is used to find an element from a web element
 * in the current browsing context that can be used for future commands.
 *
 * @alias browser.findElementFromElement
 * @see https://w3c.github.io/webdriver/#dfn-find-element-from-element
 * @param {string} using  a valid element location strategy
 * @param {string} value  the actual selector that will be used to find an element
 * @return {Object}       A JSON representation of an element object.
 */
export default async function findElementFromElement (
    this: DevToolsDriver,
    { elementId, using, value }: { elementId: string, using: string, value: string }
) {
    if (!SUPPORTED_SELECTOR_STRATEGIES.includes(using)) {
        throw new Error(`selector strategy "${using}" is not yet supported`)
    }

    const elementHandle = await this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    if (using === 'link text') {
        using = 'xpath'
        value = `.//a[normalize-space() = "${value}"]`
    } else if (using === 'partial link text') {
        using = 'xpath'
        value = `.//a[contains(., "${value}")]`
    } else if (using === 'shadow') {
        /**
         * `shadow/<selector>` is the way query-selector-shadow-dom
         * understands to query for shadow elements
         */
        using = 'css'
        value = `shadow/${value}`
    }

    return findElement.call(this, elementHandle, using, value)
}
