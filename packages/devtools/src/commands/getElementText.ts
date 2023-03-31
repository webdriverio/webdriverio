import command from '../scripts/getElementText.js'
import { getStaleElementError } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Get Element Text command intends to return an element’s text \"as rendered\".
 * An element's rendered text is also used for locating a elements
 * by their link text and partial link text.
 *
 * @alias browser.getElementText
 * @see https://w3c.github.io/webdriver/#dfn-get-element-text
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 * @return {string}           The visible text of the element (including child elements).
 */
export default async function getElementText (
    this: DevToolsDriver,
    { elementId }: { elementId: string }
) {
    const elementHandle = await this.elementStore.get(elementId)
    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    return page.$eval('html', command, elementHandle)
}
