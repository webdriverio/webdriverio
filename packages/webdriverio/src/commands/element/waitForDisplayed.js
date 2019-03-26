
/**
 *
 * Wait for an element for the provided amount of
 * milliseconds to be displayed or not displayed.
 *
 * <example>
    :index.html
    <div id="elem" style="visibility: hidden;">Hello World!</div>
    <script type="text/javascript">
        setTimeout(() => {
            document.getElementById('elem').style.visibility = 'visible';
        }, 2000);
    </script>
    :waitForVisibleExample.js
    it('should detect when element is visible', () => {
        const elem = $('#elem')
        elem.waitForDisplayed(3000);
    });
    it('should detect when element is no longer visible', () => {
        const elem = $('#elem')
        // passing 'undefined' allows us to keep the default timeout value without overwriting it
        elem.waitForDisplayed(undefined, true);
    });
 * </example>
 *
 * @alias element.waitForDisplayed
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @param {String=}  error    if exists it overrides the default error message
 * @return {Boolean} true     if element is displayed (or doesn't if flag is set)
 * @uses utility/waitUntil, state/isDisplayed
 * @type utility
 *
 */

export default async function waitForDisplayed (ms, reverse = false, error) {
    /*
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout
    }

    const isReversed = reverse ? '' : 'not '
    const errorMsg = typeof error === 'string' ? error : `element ("${this.selector}") still ${isReversed}displayed after ${ms}ms`

    return this.waitUntil(async () => reverse !== await this.isDisplayed(), ms, errorMsg)
}
