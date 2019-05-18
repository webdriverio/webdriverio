/**
 *
 * Returns browser window size (and position for drivers with W3C support).
 *
 * <example>
 * :getWindowSize.js
    it('should return browser window size', function () {
        const windowSize = browser.getWindowSize(500, 600);
        console.log(windowSize);
        // outputs
        // Firefox: { x: 4, y: 23, width: 1280, height: 767 }
        // Chrome: { width: 1280, height: 767 }
    });
 * </example>
 *
 * @alias browser.getWindowSize
 * @return {Object} { x, y, width, height } for W3C or { width, height } for non W3C browser
 * @type window
 *
 */

import { getBrowserObject } from '../../utils'

export default function getWindowSize() {
    const browser = getBrowserObject(this)

    if (!browser.isW3C) {
        return browser._getWindowSize()
    }
    return browser.getWindowRect()
}
