/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (dis/en)abled. If multiple elements get queried by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is (dis/en)abled.
 *
 * <example>
    :index.html
    <input type="text" id="username" value="foobar" disabled="disabled"></input>
    <script type="text/javascript">
        setTimeout(function () {
            document.getElementById('username').disabled = false
        }, 2000);
    </script>

    :waitForEnabledExample.js
    it('should detect when element is enabled', function () {
        browser.waitForEnabled('#username', 3000);

        // same as
        elem = $('#username');
        elem.waitForEnabled(3000)
    });
 * </example>
 *
 * @alias browser.waitForEnabled
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @uses utility/waitUntil, state/isEnabled
 * @type utility
 *
 */

let waitForEnabled = function (selector, ms, reverse) {
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
    const errorMsg = `element ("${selector || this.lastResult.selector}") still ${isReversed}enabled after ${ms}ms`

    return this.waitUntil(() => {
        return this.isEnabled(selector).then((isEnabled) => {
            if (!Array.isArray(isEnabled)) {
                return isEnabled !== reverse
            }

            var result = reverse
            for (let val of isEnabled) {
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

export default waitForEnabled
