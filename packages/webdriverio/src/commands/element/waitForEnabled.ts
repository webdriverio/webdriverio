import type { WaitForOptions } from '../../types.js'

/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (dis/en)abled. If multiple elements get queried by given
 * selector, it returns true if at least one element is (dis/en)abled.
 *
 * :::info
 *
 * As opposed to other element commands WebdriverIO will not wait for the element
 * to exist to execute this command.
 *
 * :::
 *
 * <example>
    :index.html
    <input type="text" id="username" value="foobar" disabled="disabled"></input>
    <script type="text/javascript">
        setTimeout(() => {
            document.getElementById('username').disabled = false
        }, 2000);
    </script>
    :waitForEnabledExample.js
    it('should detect when element is enabled', async () => {
        await $('#username').waitForEnabled({ timeout: 3000 });
    });

    it('should detect when element is disabled', async () => {
        elem = await $('#username');
        await elem.waitForEnabled({ reverse: true })
    });
 * </example>
 *
 * @alias element.waitForEnabled
 * @param {WaitForOptions=}  options             waitForEnabled options (optional)
 * @param {Number=}          options.timeout     time in ms (default: 500)
 * @param {Boolean=}         options.reverse     if true it waits for the opposite (default: false)
 * @param {String=}          options.timeoutMsg  if exists it overrides the default error message
 * @param {Number=}          options.interval    interval between checks (default: `waitforInterval`)
 * @return {Boolean} true     if element is (dis/en)abled
 * @uses utility/waitUntil, state/isEnabled
 * @type utility
 *
 */
export async function waitForEnabled(
    this: WebdriverIO.Element,
    {
        timeout = this.options.waitforTimeout,
        interval = this.options.waitforInterval,
        reverse = false,
        timeoutMsg = `element ("${this.selector}") still ${reverse ? '' : 'not '}enabled after ${timeout}ms`
    }: WaitForOptions = {}
) {
    /**
     * if the element doesn't already exist, wait for it to exist
     */
    if (!this.elementId && !reverse) {
        await this.waitForExist({ timeout, interval, timeoutMsg })
    }

    return this.waitUntil(
        async () => reverse !== await this.isEnabled(),
        { timeout, interval, timeoutMsg }
    )
}
