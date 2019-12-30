
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
        form.$(".send").click();
        notification.waitForExist({ timeout: 5000 });
        expect(notification.getText()).to.be.equal('Data transmitted successfully!')
    });
    it('should remove a message after successful form submit', function () {
        const form = $('form');
        const message = $('.message');
        form.$(".send").click();
        // passing 'undefined' allows us to keep the default timeout value without overwriting it
        message.waitForExist({ reverse: true });
    });
 * </example>
 *
 * @alias element.waitForExist
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it instead waits for the selector to not match any elements (default: false)
 * @param {String=}  error    if exists it overrides the default error message
 * @return {Boolean} true     if element exists (or doesn't if flag is set)
 * @uses utility/waitUntil, state/isExisting
 * @type utility
 *
 */

export default function waitForExist ({
    timeout = this.options.waitforTimeout,
    interval = this.options.waitforInterval,
    reverse = false,
    timeoutMsg = `element ("${this.selector}") still ${reverse ? '' : 'not '}existing after ${timeout}ms`
} = {}) {
    return this.waitUntil(
        async () => reverse !== await this.isExisting(),
        { timeout, interval, timeoutMsg }
    )
}
