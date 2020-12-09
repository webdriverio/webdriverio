/**
 *
 * Returns browser window size.
 *
 * <example>
 * :getWindowSize.js
    it('should return browser window size', function () {
        const windowSize = browser.getWindowSize();
        console.log(windowSize);
        // outputs `{ width: 1280, height: 767 }`
    });
 * </example>
 *
 * @alias browser.getWindowSize
 * @return {Object} { x, y, width, height } for W3C or { width, height } for non W3C browser
 * @type window
 *
 */

import { getBrowserObject } from '../../utils'

interface BrowserSize {
    width: number
    height: number
}

export default async function getWindowSize(this: WebdriverIO.BrowserObject) {
    const browser = getBrowserObject(this)

    if (!browser.isW3C) {
        return browser._getWindowSize() as unknown as BrowserSize
    }

    const { width, height } = await browser.getWindowRect() as BrowserSize
    return { width, height } as BrowserSize
}
