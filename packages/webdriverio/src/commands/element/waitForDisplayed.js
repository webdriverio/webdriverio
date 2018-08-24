
/**
 *
 * Wait for an element for the provided amount of
 * milliseconds to be displayed or not displayed.
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
        const elem = $('#elem')
        elem.waitForDisplayed(3000);
    });
 * </example>
 *
 * @alias browser.waitForDisplayed
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @uses utility/waitUntil, state/isDisplayed
 * @type utility
 *
 */

export default async function waitForDisplayed (ms, reverse = false) {
    /**
     * if element wasn't found in the first place wait for its existance first
     */
    if (!this.elementId && !reverse) {
        await this.waitForExist(ms)
    }

    /*
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout
    }

    const isReversed = reverse ? '' : 'not'
    const errorMsg = `element ("${this.selector}") still ${isReversed} displayed after ${ms}ms`

    return this.waitUntil(async () => {
        const isVisible = await this.isElementDisplayed(this.elementId)

        return isVisible !== reverse
    }, ms, errorMsg)
}