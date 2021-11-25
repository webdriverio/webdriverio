import command from '../scripts/getElementCSSValue'
import { getStaleElementError } from '../utils'
import type DevToolsDriver from '../devtoolsdriver'

/**
 * The Get Element CSS Value command retrieves the computed value
 * of the given CSS property of the given web element.
 *
 * @alias browser.getElementCSSValue
 * @see https://w3c.github.io/webdriver/#dfn-get-element-css-value
 * @param {string} elementId     the id of an element returned in a previous call to Find Element(s)
 * @param {string} propertyName  name of the CSS property to retrieve
 * @param {?string} [pseudoElement]  the pseudo-element to match. Omitted (or null) for real elements
 * @return {string}              The computed value of the parameter corresponding to property name from the element's style declarations (unless the document type is xml, in which case the return value is simply the empty string).
 */
export default async function getElementCSSValue (
    this: DevToolsDriver,
    { elementId, propertyName }: { elementId: string, propertyName: string },
    pseudoElement?: string | null
) {
    const elementHandle = await this.elementStore.get(elementId)
    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    return page.$eval('html', command, elementHandle, propertyName, pseudoElement ?? null)
}
