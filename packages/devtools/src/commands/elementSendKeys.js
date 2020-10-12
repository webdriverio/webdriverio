/**
 * The Element Send Keys command scrolls into view the form control element and then sends
 * the provided keys to the element. In case the element is not keyboard-interactable,
 * an element not interactable error is returned. The key input state used for input
 * may be cleared mid-way through "typing" by sending the null key, which is U+E000 (NULL)
 *
 * @alias browser.elementSendKeys
 * @see https://w3c.github.io/webdriver/#dfn-element-send-keys
 * @param {string} elementId  the id of an element returned in a previous call to Find Element(s)
 * @param {string} text       string to send as keystrokes to the element
 */

import { getStaleElementError } from '../utils'
import path from 'path'

export default async function elementSendKeys ({ elementId, text }) {
    const elementHandle = await this.elementStore.get(elementId)

    if (!elementHandle) {
        throw getStaleElementError(elementId)
    }

    await elementHandle.focus()
    const page = this.getPageHandle()
    const tagName = await (await elementHandle.getProperty('tagName')).jsonValue()
    const type = await (await elementHandle.getProperty('type')).jsonValue()

    if (tagName === 'INPUT' && type === 'file'){
        const paths = (text || '').split('\n').map(p => path.resolve(p))
        await elementHandle.uploadFile(...paths)
    } else {
        await page.keyboard.type(text)
    }

    return null
}
