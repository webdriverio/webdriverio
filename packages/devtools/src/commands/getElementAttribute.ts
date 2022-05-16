import command from '../scripts/getElementAttribute.js'
import { getStaleElementError } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver'

/**
 * The Get Element Attribute command will return the attribute of a web element.
 *
 * @alias browser.getElementAttribute
 * @see https://w3c.github.io/webdriver/#dfn-get-element-attribute
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 * @param {string} name       name of the attribute value to retrieve
 * @return {string}           The named attribute of the element.
 */
export default async function getElementAttribute (
    this: DevToolsDriver,
    { elementId, name }: { elementId: string, name: string }
) {
    const elementHandle = await this.elementStore.get(elementId)
    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    return page.$eval('html', command, elementHandle, name)
}
