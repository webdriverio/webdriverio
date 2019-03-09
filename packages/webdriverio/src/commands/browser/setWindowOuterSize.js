/**
 *
 * Resizes browser window outer size according to provided width and height.
 *
 * <example>
 * :setWindowOuterSize.js
    it('should re-size browser outer window with 500 width and 600 height', function () {
        browser.setWindowOuterSize(500, 600);
    });
 * </example>
 *
 * @alias browser.setWindowOuterSize
 * @param {Number} width, browser will be resized to provided width
 * @param {Number} height, browser will be resized to provided height
 * @return {Null} 
 * @type window
 *
 */

import { getBrowserObject } from '../../utils'

export default function setWindowOuterSize(width, height) {
    const minWindowSize = 0
    const maxWindowSize = 2147483647

    /**
     * type check
     */
    if (typeof width !== 'number' || typeof height !== 'number') {
        throw new Error('setWindowOuterSize expects width and height of type number')
    }

    /**
     * value check
     */
    if ((width < minWindowSize || width > maxWindowSize) || (height < minWindowSize || height > maxWindowSize)) {
        throw new Error('setWindowOuterSize expects width and height to be a number in the 0 to 2^31 − 1 range')
    }

    const browser = getBrowserObject(this)

    if (browser.isW3C) {
        browser.setWindowRect(null, null, width, height)
    } else {
        browser.setWindowSize(width, height)
    }

    return null
}
