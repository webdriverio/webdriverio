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

const minWindowSize = 0
const maxWindowSize = Number.MAX_SAFE_INTEGER

export default async function setWindowSize(
    this: WebdriverIO.BrowserObject,
    width: number,
    height: number
): Promise<void> {
    /**
     * type check
     */
    if (typeof width !== 'number' || typeof height !== 'number') {
        throw new Error('setWindowSize expects width and height of type number')
    }

    /**
     * value check
     */
    if (width < minWindowSize || width > maxWindowSize || height < minWindowSize || height > maxWindowSize) {
        throw new Error('setWindowSize expects width and height to be a number in the 0 to 2^31 − 1 range')
    }

    const browser = getBrowserObject(this)

    return !browser.isW3C
        ? browser._setWindowSize(width, height)
        : browser.setWindowRect(null, null, width, height) as any as Promise<void>
}
