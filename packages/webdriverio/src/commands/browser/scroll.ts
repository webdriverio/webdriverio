import logger from '@wdio/logger'

const log = logger('webdriverio')

/**
 *
 * Scroll within the browser viewport.
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
 * @alias element.scrollIntoView
 * @param {number=} x  horizontal scroll position (default: `0`)
 * @param {number=} y  vertical scroll position (default: `0`)
 * @uses protocol/execute
 * @type utility
 *
 */
export default function scroll (
    this: WebdriverIO.Browser,
    x = 0,
    y = 0
) {
    if (!x && !y) {
        return log.warn('"scroll" command was called with no parameters, skipping execution')
    }

    return this.action('wheel')
        .scroll({
            deltaX: x,
            deltaY: y,
            /**
             * needed otherwise the command finished before
             * scrolling position is reached
             */
            duration: 200
        })
        .perform()
}
