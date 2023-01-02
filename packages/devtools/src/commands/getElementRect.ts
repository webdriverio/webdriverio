import command from '../scripts/getElementRect.js'
import { getStaleElementError } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Get Element Rect command returns the dimensions and coordinates of the given web element.
 *
 * @alias browser.getElementRect
 * @see https://w3c.github.io/webdriver/#dfn-get-element-rect
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 * @return {string}           A JSON object representing the position and bounding rect of the element.
 */
export default async function getElementRect (
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
