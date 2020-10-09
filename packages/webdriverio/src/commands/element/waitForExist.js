
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
        message.waitForExist({ reverse: true });
    });
 * </example>
 *
 * @alias element.waitForExist
 * @param {WaitForOptions=}  options             waitForEnabled options (optional)
 * @param {Number=}          options.timeout     time in ms (default: 500)
 * @param {Boolean=}         options.reverse     if true it waits for the opposite (default: false)
 * @param {String=}          options.timeoutMsg  if exists it overrides the default error message
 * @param {Number=}          options.interval    interval between checks (default: `waitforInterval`)
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
