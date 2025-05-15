import { setViewport as setViewportBrowser } from '../browser/setViewport.js'

/**
 * Resizes the browser viewport within the browser. As oppose to `setWindowSize`,
 * this command changes the viewport size, not the window size.
 *
 * <example>
 * :setWindowSize.js
    it('should set viewport to emulate iPhone 15', async () => {
        const context = await browser.url('https://webdriver.io')
        await context.setViewport({
            width: 393,
            height: 659,
            deviceScaleFactor: 3
        });
    });
 * </example>
 *
 * @alias page.setWindowSize
 * @param {SetViewportOptions} options                  command arguments
 * @param {number}             options.width            viewport width in pixels
 * @param {number}             options.height           viewport height in pixels
 * @param {number}             options.devicePixelRatio pixel ratio of the viewport
 * @return {Promise<void>}
 * @type window
 */
export const setViewport = setViewportBrowser
