/**
 *
 * Resizes browser window outer size according to provided width and height
 *
 * </example>
 *
 * @alias browser.setWindowOuterSize
 * @param {Number} width, a new browser width
 * @param {Number} height, a new browser height
 * @type window
 *
 */

import { getBrowserObject } from '../../utils'

const noSetWindowRectSupport = ['chrome']

export default function setWindowOuterSize(width, height) {

    const browser = getBrowserObject(this)

    if (noSetWindowRectSupport.includes(browser.capabilities.browserName.toLowerCase())){
        return browser.setWindowSize(width, height)
    } 

    return browser.setWindowRect(null, null, width, height)
}
