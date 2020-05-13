/** 
 * 
 * The Element Clear command scrolls into view an editable or resettable element and then attempts 
 * to clear its selected files or text content.
 * 
 */

import command from '../scripts/elementClear'
import { getStaleElementError } from '../utils'

export default async function elementClear ({ elementId }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    const page = this.getPageHandle(true)
    await page.$eval('html', command, elementHandle)
    return null
}
