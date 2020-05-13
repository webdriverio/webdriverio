/**
 * 
 * The Get Element CSS Value command retrieves the computed value 
 * of the given CSS property of the given web element.
 * 
 */

import command from '../scripts/getElementCSSValue'
import { getStaleElementError } from '../utils'

export default async function getElementCSSValue ({ elementId, propertyName }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    return page.$eval('html', command, elementHandle, propertyName)
}
