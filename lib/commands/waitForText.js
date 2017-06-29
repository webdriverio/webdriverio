/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to have text/content. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element has text/content.
 *
 * <example>
    :index.html
    <div id="elem"></div>
    <script type="text/javascript">
        setTimeout(function () {
            document.getElementById('elem').innerHTML = 'some text';
        }, 2000);
    </script>

    :waitForTextExample.js
    it('should detect when element has text', function () {
        browser.waitForText('#elem', 3000);

        // same as
        elem = $('#elem');
        elem.waitForText(3000)
    });
 * </example>
 *
 * @alias browser.waitForText
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @uses utility/waitUntil, property/getText
 * @type utility
 *
 */

let waitForText = function (selector, ms, reverse) {
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

    const isReversed = reverse ? 'with' : 'without'
    const errorMsg = `element ("${selector || this.lastResult.selector}") still ${isReversed} text after ${ms}ms`

    return this.waitUntil(() => {
        return this.getText(selector).then((text) => {
            if (!Array.isArray(text)) {
                return (text !== '') !== reverse
            }

            let result = reverse
            for (let val of text) {
                if (!reverse) {
                    result = result || val !== ''
                } else {
                    result = result && val === ''
                }
            }

            return result !== reverse
        })
    }, ms, errorMsg)
}

export default waitForText
