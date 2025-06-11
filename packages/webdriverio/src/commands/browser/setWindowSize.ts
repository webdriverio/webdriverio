import { getBrowserObject } from '@wdio/utils'

const minWindowSize = 0
const maxWindowSize = Number.MAX_SAFE_INTEGER

/**
 *
 * Resizes browser window outer size according to provided width and height. Based on your operating
 * system some browser windows might now allow you so have a smaller width than `500px`. If you want
 * to mimic the viewport of e.g. an iPhone you should consider using the `setViewport` command.
 *
 * <example>
 * :setWindowSize.js
    it('should re-size browser outer window with 500 width and 600 height', async () => {
        await browser.setWindowSize(500, 600);
    });
 * </example>
 *
 * @alias browser.setWindowSize
 * @param {number} width browser will be resized to provided width
 * @param {number} height browser will be resized to provided height
 * @return {Null|Object} Null for *NO*W3C browser and Object `{x, y, width, height}` for W3C browser
 * @type window
 *
 */
export async function setWindowSize(
    this: WebdriverIO.Browser,
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

    await browser.setWindowRect(null, null, width, height)
}
