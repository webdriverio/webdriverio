/**
 *
 * Resizes browser window outer size according to provided width and height.
 *
 * <example>
 * :setWindowSize.js
    it('should re-size browser outer window with 500 width and 600 height', function () {
        browser.setWindowSize(500, 600);
    });
 * </example>
 *
 * @alias browser.setWindowSize
 * @param {Number} width browser will be resized to provided width
 * @param {Number} height browser will be resized to provided height
 * @return {Null|Object} Null for *NO*W3C browser and Object{x, y, width, height} for W3C browser
 * @type window
 *
 */

import { getBrowserObject } from '../../utils'

export default function setWindowSize(width, height) {
    const minWindowSize = 0
    const maxWindowSize = 2147483647

    /**
     * type check
     */
    if (typeof width !== 'number' || typeof height !== 'number') {
        throw new Error('setWindowSize expects width and height of type number')
    }

    /**
     * value check
     */
    if ((width < minWindowSize || width > maxWindowSize) || (height < minWindowSize || height > maxWindowSize)) {
        throw new Error('setWindowSize expects width and height to be a number in the 0 to 2^31 − 1 range')
    }

    const browser = getBrowserObject(this)

    if (!browser.isW3C) {
        return browser._setWindowSize(width, height)
    }
    return browser.setWindowRect(null, null, width, height)
}
