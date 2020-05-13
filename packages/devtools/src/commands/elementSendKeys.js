/** 
 * 
 * The Element Send Keys command scrolls into view the form control element and then sends 
 * the provided keys to the element. In case the element is not keyboard-interactable, 
 * an element not interactable error is returned. The key input state used for input 
 * may be cleared mid-way through \"typing\" by sending the null key, which is U+E000 (NULL)
 */

import { getStaleElementError } from '../utils'

export default async function elementSendKeys ({ elementId, text }) {
    const elementHandle = this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    await elementHandle.focus()
    const page = this.getPageHandle()
    await page.keyboard.type(text)

    return null
}
