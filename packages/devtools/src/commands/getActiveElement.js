/**
 * Get Active Element returns the active element of the current browsing context’s document element.
 *
 * @param browser.getActiveElement
 * @see https://w3c.github.io/webdriver/#dfn-get-active-element
 * @return {Object}       A JSON representation of an element object.
 */

import findElement from './findElement'
import command from '../scripts/getActiveElement'
import cleanUp from '../scripts/cleanUpSerializationSelector'
import { SERIALIZE_PROPERTY } from '../constants'

export default async function getActiveElement () {
    const page = this.getPageHandle(true)
    const selector = `[${SERIALIZE_PROPERTY}]`

    /**
     * set data property to active element to allow to query for it
     */
    const hasElem = await page.$eval('html', command, SERIALIZE_PROPERTY)

    if (!hasElem) {
        throw new Error('no element active')
    }

    /**
     * query for element
     */
    const activeElement = await findElement.call(this, {
        using: 'css selector',
        value: selector
    })

    /**
     * clean up data property
     */
    await page.$eval(selector, cleanUp, SERIALIZE_PROPERTY)

    return activeElement
}
