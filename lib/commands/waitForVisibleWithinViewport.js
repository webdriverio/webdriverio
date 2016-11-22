/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (in)visible within the viewport. If multiple elements get
 * queryied by given selector, it returns true (or false if reverse flag is set)
 * if at least one element is visible.
 *
 * <example>
    :index.html
    <div id="elem" style="position:absolute; top: -100px; height: 50px;">
        Hello World!
    </div>
    <script type="text/javascript">
        setTimeout(function () {
            document.getElementById('elem').style.top = '0px';
        }, 2000);
    </script>

    :waitForVisibleExample.js
    it(
        'should detect when element is visible within the viewport',
        function () {
            browser.waitForVisibleWithinViewport('#elem', 3000);

            // same as
            elem = $('#elem');
            elem.waitForVisibleWithinViewport(3000)
        }
    );
 * </example>
 *
 * @alias browser.waitForVisibleWithinViewport
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @uses utility/waitUntil, state/isVisible
 * @type utility
 *
 */

import { WaitUntilTimeoutError, isTimeoutError } from '../utils/ErrorHandler'

import isVisibleWithinViewportFunc from '../scripts/isWithinViewport'

let waitForVisibleWithinViewport = function (selector, ms, reverse) {
    /**
     * we can't use default values for function parameter here because this would
     * break the ability to chain the command with an element if reverse is used, like
     *
     * ```js
     * var elem = $('#elem');
     * elem.waitForXXX(10000, true);
     * ```
     */
    reverse = typeof reverse === 'boolean' ? reverse : false

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout
    }

    return this.waitUntil(() => {
        return this.selectorExecute(selector, isVisibleWithinViewportFunc).then((isVisibleWithinViewport) => {
            if (!Array.isArray(isVisibleWithinViewport)) {
                return reverse
            } else if (Array.isArray(isVisibleWithinViewport) && isVisibleWithinViewport.length === 1) {
                return isVisibleWithinViewport[0] !== reverse
            }

            let result = reverse
            for (let val of isVisibleWithinViewport) {
                if (!reverse) {
                    result = result || val
                } else {
                    result = result && val
                }
            }

            return result !== reverse
        }, (err) => {
            /**
             * if element does not exist it is automatically not visible :-)
             */
            if (err.message.indexOf('NoSuchElement') > -1 && reverse) {
                return true
            }

            throw err
        })
    }, ms).catch((e) => {
        selector = selector || this.lastResult.selector

        if (isTimeoutError(e)) {
            let isReversed = reverse ? '' : 'not'
            throw new WaitUntilTimeoutError(`element (${selector}) still ${isReversed} visible within the viewport after ${ms}ms`)
        }
        throw e
    })
}

export default waitForVisibleWithinViewport
