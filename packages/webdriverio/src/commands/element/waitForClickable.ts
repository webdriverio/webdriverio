import type { WaitForOptions } from '../../types.js'

/**
 * Wait for an element for the provided amount of milliseconds to be clickable or not clickable.
 *
 * :::info
 *
 * As opposed to other element commands WebdriverIO will not wait for the element to exist to execute
 * this command.
 *
 * :::
 *
 * <example>
    :waitForClickable.js
    it('should detect when element is clickable', async () => {
        const elem = await $('#elem')
        await elem.waitForClickable({ timeout: 3000 });
    });
    it('should detect when element is no longer clickable', async () => {
        const elem = await $('#elem')
        await elem.waitForClickable({ reverse: true });
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
export async function waitForClickable (
    this: WebdriverIO.Element,
    {
        timeout = this.options.waitforTimeout,
        interval = this.options.waitforInterval,
        reverse = false,
        timeoutMsg = `element ("${this.selector}") still ${reverse ? '' : 'not '}clickable after ${timeout}ms`
    }: WaitForOptions = {}
) {
    return this.waitUntil(
        async () => reverse !== await this.isClickable(),
        { timeout, timeoutMsg, interval }
    )
}
