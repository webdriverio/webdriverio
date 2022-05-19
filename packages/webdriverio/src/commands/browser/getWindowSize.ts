import { getBrowserObject } from '../../utils/index.js'

interface BrowserSize {
    width: number
    height: number
}

/**
 *
 * Returns browser window size.
 *
 * <example>
    :getWindowSize.js
    it('should return browser window size', async () => {
        const windowSize = await browser.getWindowSize();
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
export default async function getWindowSize(this: WebdriverIO.Browser) {
    const browser = getBrowserObject(this)

    if (!browser.isW3C) {
        return browser._getWindowSize() as unknown as BrowserSize
    }

    const { width, height } = await browser.getWindowRect() as BrowserSize
    return { width, height } as BrowserSize
}
