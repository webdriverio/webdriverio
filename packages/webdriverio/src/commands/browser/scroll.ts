import logger from '@wdio/logger'
import { getBrowserObject } from '@wdio/utils'
const log = logger('webdriverio')

/**
 *
 * Scroll within the browser viewport. Note that `x` and `y` coordinates are relative to the current
 * scroll positon, therefore `browser.scroll(0, 0)` is a non operation.
 *
 * <example>
    :scroll.js
    it('should demonstrate the scroll command', async () => {
        await browser.url('https://webdriver.io')

        console.log(await browser.execute(() => window.scrollY)) // returns 0
        await browser.scroll(0, 200)
        console.log(await browser.execute(() => window.scrollY)) // returns 200
    });
 * </example>
 *
 * @alias element.scroll
 * @param {number} [x=0]  horizontal scroll position (default: `0`)
 * @param {number} [y=0]  vertical scroll position (default: `0`)
 * @uses protocol/execute
 * @type utility
 *
 */
export function scroll (
    this: WebdriverIO.Browser | WebdriverIO.BrowsingContext,
    x = 0,
    y = 0
) {
    if (!x && !y) {
        return log.warn('"scroll" command was called with no parameters, skipping execution')
    }

    const browser = getBrowserObject(this)

    // Appium does not support the "wheel" action
    if (browser.isMobile) {
        return browser.execute((x, y) => window.scrollBy(x, y), x, y)
    }

    return (this as WebdriverIO.BrowsingContext).action('wheel')
        .scroll({
            deltaX: x,
            deltaY: y,
            duration: 0
        })
        .perform()
}
