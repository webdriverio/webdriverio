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
    it('should detect when element is enabled', () => {
        browser.waitForEnabled('#username', 3000);

        // Same as
        elem = $('#username');
        elem.waitForEnabled(3000)
    });

    it('should detect when element is disabled', () => {
        browser.waitForEnabled('#username', 3000, true);

        // Same as
        elem = $('#username');
        elem.waitForEnabled(3000, true)
    });
 * </example>
 *
 * @alias browser.waitForEnabled
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @uses utility/waitUntil, state/isEnabled
 * @type utility
 *
 */

export default async function waitForEnabled(ms, reverse = false) {
    // If the element doesn't already exist, wait for it to exist
    if (!this.elementId && !reverse) {
        await this.waitForExist(ms)
    }

    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout
    }

    const isReversed = reverse ? '' : 'not'
    const errorMessage = `element ("${this.selector}") still ${isReversed} enabled after ${ms}ms`

    return this.waitUntil(async () => {
        const isEnabled = await this.isEnabled()

        return isEnabled !== reverse
    }, ms, errorMessage)
}