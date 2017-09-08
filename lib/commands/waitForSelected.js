/**
 *
 * Wait for an option or radio/checkbox element (selected by css selector) for the provided amount of
 * milliseconds to be (un)selected or (un)checked. If multiple elements get queried by a given
 * selector, it returns true (or false if reverse flag is set) if at least one element is (un)selected.
 *
 * <example>
    :index.html
    <select>
        <option value="1" id="option1">1</option>
        <option value="2" id="option2" selected="selected">2</option>
        <option value="3" id="option3">3</option>
    </select>
    <script type="text/javascript">
        setTimeout(function () {
            document.getElementById('option1').selected = true;
        }, 2000);
    </script>

    :waitForSelectedExample.js
    it('should detect when an option is selected', function () {
        browser.waitForSelected('#option1', 3000);

        // same as
        elem = $('#option1');
        elem.waitForSelected(3000)
    });
 * </example>
 *
 * @alias browser.waitForSelected
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @uses utility/waitUntil, state/isSelected
 * @type utility
 *
 */

let waitForSelected = function (selector, ms, reverse) {
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

    const isReversed = reverse ? '' : 'not'
    const errorMsg = `element ("${selector || this.lastResult.selector}") still ${isReversed} selected after ${ms}ms`

    return this.waitUntil(() => {
        return this.isSelected(selector).then((isSelected) => {
            if (!Array.isArray(isSelected)) {
                return isSelected !== reverse
            }

            let result = reverse
            for (let val of isSelected) {
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

export default waitForSelected
