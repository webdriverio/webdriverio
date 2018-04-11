/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (in)visible. If multiple elements get queried by a given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is visible.
 *
 * <example>
    :index.html
    <div id="elem" style="visibility: hidden;">Hello World!</div>
    <script type="text/javascript">
        setTimeout(function () {
            document.getElementById('elem').style.visibility = 'visible';
        }, 2000);
    </script>

    :waitForVisibleExample.js
    it('should detect when element is visible', function () {
        browser.waitForVisible('#elem', 3000);

        // same as
        elem = $('#elem');
        elem.waitForVisible(3000)
    });
 * </example>
 *
 * @alias browser.waitForVisible
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @uses utility/waitUntil, state/isVisible
 * @type utility
 *
 */

let waitForVisible = function (selector, ms, reverse) {
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

    const isReversed = reverse ? '' : 'not '
    const errorMsg = `element ("${selector || this.lastResult.selector}") still ${isReversed}visible after ${ms}ms`

    return this.waitUntil(() => {
        return this.isVisible(selector).then((isVisible) => {
            if (!Array.isArray(isVisible)) {
                return isVisible !== reverse
            }

            let result = reverse
            for (let val of isVisible) {
                if (!reverse) {
                    result = result || val
                } else {
                    result = result && val
                }
            }

            return result !== reverse
        })
    }, ms, errorMsg)
}

export default waitForVisible
