
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
        $('#elem').waitForVisible(3000);
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

export default function waitForVisible (ms, reverse = false) {
    /**
     * if element wasn't found in the first place wait for its existance first
     */
    if (!this.elementId && !reverse) {
        return this.waitForExist(ms).then(() => this.waitForVisible(ms))
    }

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout
    }

    const isReversed = reverse ? '' : 'not'
    const errorMsg = `element ("${this.selector}") still ${isReversed} visible after ${ms}ms`

    return this.waitUntil(function async () {
        return this.isElementDisplayed(this.elementId)
            .then((isVisible) => isVisible !== reverse)
    }, ms, errorMsg)
}
