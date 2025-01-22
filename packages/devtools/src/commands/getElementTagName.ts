import command from '../scripts/getElementTagName.js'
import { getStaleElementError } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver.js'

/**
 * The Get Element Tag Name command returns the qualified element name of the given web element.
 *
 * @alias browser.getElementTagName
 * @see https://w3c.github.io/webdriver/#dfn-get-element-tag-name
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 * @return {string}           The tagName attribute of the element.
 */
export default async function getElementTagName (
    this: DevToolsDriver,
    { elementId }: { elementId: string }
) {
    const elementHandle = await this.elementStore.get(elementId)
    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    const result = await page.$eval('html', command, elementHandle)
    return (result || '').toLowerCase()
}
