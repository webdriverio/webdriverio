
/**
 * Wait for an element for the provided amount of
 * milliseconds to be clickable or not clickable.
 *
 * <example>
    :waitForClickable.js
    it('should detect when element is clickable', () => {
        const elem = $('#elem')
        elem.waitForClickable({ timeout: 3000 });
    });
    it('should detect when element is no longer clickable', () => {
        const elem = $('#elem')
        elem.waitForClickable({ reverse: true });
    });
 * </example>
 *
 * @alias element.waitForClickable
 * @param {WaitForOptions=}  options             waitForEnabled options (optional)
 * @param {Number=}          options.timeout     time in ms (default: 500)
 * @param {Boolean=}         options.reverse     if true it waits for the opposite (default: false)
 * @param {String=}          options.timeoutMsg  if exists it overrides the default error message
 * @param {Number=}          options.interval    interval between checks (default: `waitforInterval`)
 * @return {Boolean} `true` if element is clickable (or doesn't if flag is set)
 *
 */

export default async function waitForClickable ({
    timeout = this.options.waitforTimeout,
    interval = this.options.waitforInterval,
    reverse = false,
    timeoutMsg = `element ("${this.selector}") still ${reverse ? '' : 'not '}clickable after ${timeout}ms`
} = {}) {
    return this.waitUntil(
        async () => reverse !== await this.isClickable(),
        { timeout, timeoutMsg, interval }
    )
}
