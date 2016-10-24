/**
 *
 * This command changes the viewport size of the browser. When talking about browser size we have to differentiate
 * between the actual window size of the browser application and the document/viewport size of the website. The
 * window size will always be bigger since it includes the height of any menu or status bars.
 *
 * The command tries to resize the browser multiple times (max 5 times) because Webdriver only allows to change
 * the window size and doesn't take the viewport into consideration. This is handled by WebdriverIO internally.
 *
 * <example>
    :setViewportSize.js
    it('should resize the current viewport', function () {
        browser.setViewportSize({
            width: 500,
            height: 500
        });

        var windowSize = browser.windowHandleSize();
        console.log(windowSize.value); // outputs: { width: 500, height: 602 }
    });
 * </example>
 *
 * @alias browser.setViewportSize
 * @param {Object}   size  window width/height
 * @param {Boolean}  type  set to `false` to change window size, `true` (default) to change viewport size
 * @uses protocol/execute, protocol/windowHandleSize
 * @type window
 *
 */

import getViewportSize from '../scripts/getViewportSize'
import { CommandError } from '../utils/ErrorHandler'

const MAX_TRIES = 5

let setViewportSize = function (size, type) {
    /**
     * parameter check
     */
    if (typeof size !== 'object' ||
        typeof size.width !== 'number' ||
        typeof size.height !== 'number' ||
        (typeof type !== 'undefined' && typeof type !== 'boolean')) {
        throw new CommandError('number or type of arguments don\'t agree with setViewportSize command')
    }

    let shouldIndent = (typeof type === 'undefined') ? true : type
    return shouldIndent ? _setViewportSize.call(this, size) : this.windowHandleSize(size)
}

/**
 * to set viewport size properly we need to execute the process multiple times
 * since the difference between the inner and outer size changes when browser
 * switch between fullscreen modes or visibility of scrollbar
 */
let _setViewportSize = function (size, retryNo = 0) {
    /**
     * get window size
     */
    return this.windowHandleSize().then((windowHandleSize) => {
        /**
         * get viewport size
         */
        return this.execute(getViewportSize).then((viewportSize) => {
            let widthDiff = windowHandleSize.value.width - viewportSize.value.screenWidth
            let heightDiff = windowHandleSize.value.height - viewportSize.value.screenHeight

            /**
             * change window size with indent
             */
            return this.windowHandleSize({
                width: size.width + widthDiff,
                height: size.height + heightDiff
            })
        }).execute(getViewportSize).then((res) => {
            /**
             * if viewport size not equals desired size, execute process again
             */
            if (retryNo < MAX_TRIES && (res.value.screenWidth !== size.width || res.value.screenHeight !== size.height)) {
                return _setViewportSize.call(this, size, ++retryNo)
            }
        })
    })
}

export default setViewportSize
