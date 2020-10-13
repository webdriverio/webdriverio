
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
        elem.waitForDisplayed({ timeout: 3000 });
    });
    it('should detect when element is no longer visible', () => {
        const elem = $('#elem')
        elem.waitForDisplayed({ reverse: true });
    });
 * </example>
 *
 * @alias element.waitForDisplayed
 * @param {WaitForOptions=}  options             waitForEnabled options (optional)
 * @param {Number=}          options.timeout     time in ms (default: 500)
 * @param {Boolean=}         options.reverse     if true it waits for the opposite (default: false)
 * @param {String=}          options.timeoutMsg  if exists it overrides the default error message
 * @param {Number=}          options.interval    interval between checks (default: `waitforInterval`)
 * @return {Boolean} true     if element is displayed (or doesn't if flag is set)
 * @uses utility/waitUntil, state/isDisplayed
 * @type utility
 *
 */

export default async function waitForDisplayed ({
    timeout = this.options.waitforTimeout,
    interval = this.options.waitforInterval,
    reverse = false,
    timeoutMsg = `element ("${this.selector}") still ${reverse ? '' : 'not '}displayed after ${timeout}ms`
} = {}) {
    return this.waitUntil(
        async () => reverse !== await this.isDisplayed(),
        { timeout, interval, timeoutMsg }
    )
}
