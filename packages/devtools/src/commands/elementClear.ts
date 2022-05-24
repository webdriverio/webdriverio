import command from '../scripts/elementClear.js'
import { getStaleElementError } from '../utils.js'
import type DevToolsDriver from '../devtoolsdriver'

/**
 * The Element Clear command scrolls into view an editable or resettable element and then attempts
 * to clear its selected files or text content.
 *
 * @alias browser.elementClear
 * @see https://w3c.github.io/webdriver/#dfn-element-clear
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 */
export default async function elementClear (
    this: DevToolsDriver,
    { elementId }: { elementId: string }
) {
    const elementHandle = await this.elementStore.get(elementId)
    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    await page.$eval('html', command, elementHandle)
    return null
}
