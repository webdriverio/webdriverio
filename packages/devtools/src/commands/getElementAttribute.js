/**
 * The Get Element Attribute command will return the attribute of a web element.
 *
 * @alias browser.getElementAttribute
 * @see https://w3c.github.io/webdriver/#dfn-get-element-attribute
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 * @param {string} name       name of the attribute value to retrieve
 * @return {string}           The named attribute of the element.
 */

import command from '../scripts/getElementAttribute'
import { getStaleElementError } from '../utils'

export default async function getElementAttribute ({ elementId, name }) {
    const elementHandle = await this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    return page.$eval('html', command, elementHandle, name)
}
