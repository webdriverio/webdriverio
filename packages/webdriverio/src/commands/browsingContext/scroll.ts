import { scroll as scrollBrowser } from '../browser/scroll.js'

/**
 *
 * Scroll within the browser viewport. Note that `x` and `y` coordinates are relative to the current
 * scroll positon, therefore `browser.scroll(0, 0)` is a non operation.
 *
 * <example>
    :scroll.js
    it('should demonstrate the scroll command', async () => {
        const context = await browser.url('https://webdriver.io')

        console.log(await context.execute(() => window.scrollY)) // returns 0
        await context.scroll(0, 200)
        console.log(await context.execute(() => window.scrollY)) // returns 200
    });
 * </example>
 *
 * @alias element.scroll
 * @param {number=} x  horizontal scroll position (default: `0`)
 * @param {number=} y  vertical scroll position (default: `0`)
 * @uses protocol/execute
 * @type utility
 *
 */
export const scroll = scrollBrowser
