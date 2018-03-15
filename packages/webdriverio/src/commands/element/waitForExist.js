
/**
 *
 * Wait for an element for the provided amount of
 * milliseconds to be present within the DOM. Returns true if the selector
 * matches at least one element that exists in the DOM, otherwise throws an
 * error. If the reverse flag is true, the command will instead return true
 * if the selector does not match any elements.
 *
 * <example>
    :waitForExistSyncExample.js
    it('should display a notification message after successful form submit', function () {
        const form = $('form');
        const notification = $('.notification');
        form.submit();
        notification.waitForExist(5000); // same as `browser.waitForExist('.notification', 5000)`
        expect(notification.getText()).to.be.equal('Data transmitted successfully!')
    });
 * </example>
 *
 * @alias browser.waitForExist
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it instead waits for the selector to not match any elements (default: false)
 * @uses utility/waitUntil, state/isExisting
 * @type utility
 *
 */

export default function waitForExist (ms, reverse = false) {
    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout
    }

    const isReversed = reverse ? '' : 'not'
    const errorMsg = `element ("${this.selector}") still ${isReversed} existing after ${ms}ms`

    return this.waitUntil(function async () {
        return this.isExisting().then((isExisting) => isExisting !== reverse)
    }, ms, errorMsg)
}
