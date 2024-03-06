import type { WaitForOptions } from '../../types.js'

/**
 * Wait for an element for the element to be clickable.
 *
 * If withinViewport is falsy, the command attempts to scroll the element to the center of the viewport and performs the above checks, after which it attempts to scroll back to it's original coordinates
 * If withinViewport is true, the command does not attempt to scroll the element to the center of the viewport and instead directly runs the above checks
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
    it('should detect when element is clickable anywhere on the page', async () => {
        const elem = await $('#elem')
        await elem.waitForClickable({ timeout: 3000 });
    });
    it('should detect when element is clickable inside the viewport only', async () => {
        const elem = await $('#elem')
        await elem.waitForClickable({ withinViewport: true });
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
 * @param {Boolean=}         options.withinViewport set to true to check if element is clickable within scrolling it into the viewport
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
        withinViewport = false,
        timeoutMsg = `element ("${this.selector}") still ${reverse ? '' : 'not '}clickable after ${timeout}ms`,
    }: WaitForOptions = {}
) {
    return this.waitUntil(
        async () => reverse !== await this.isClickable({ withinViewport }),
        { timeout, timeoutMsg, interval }
    )
}
