import type { WaitForOptions } from '../../types.js'

/**
 *
 * Wait for an element for the provided amount of milliseconds to be displayed or not displayed.
 *
 * :::info
 *
 * As opposed to other element commands WebdriverIO will not wait for the element to exist to execute
 * this command.
 *
 * :::
 *
 * @alias element.waitForDisplayed
 * @param {WaitForOptions=}  options             waitForEnabled options (optional)
 * @param {Number=}          options.timeout     time in ms (default: 500)
 * @param {Boolean=}         options.reverse     if true it waits for the opposite (default: false)
 * @param {String=}          options.timeoutMsg  if exists it overrides the default error message
 * @param {Number=}          options.interval    interval between checks (default: `waitforInterval`)
 * @return {Boolean} true     if element is displayed (or doesn't if flag is set)
 * @uses utility/waitUntil, state/isDisplayed
 * @example https://github.com/webdriverio/example-recipes/blob/0bfb2b8d212b627a2659b10f4449184b657e1d59/waitForDisplayed/index.html#L3-L8
 * @example https://github.com/webdriverio/example-recipes/blob/9ac16b4d4cf4bc8ec87f6369439a2d0bcaae4483/waitForDisplayed/waitForDisplayedExample.js#L6-L14
 * @type utility
 */
export async function waitForDisplayed (
    this: WebdriverIO.Element,
    {
        timeout = this.options.waitforTimeout,
        interval = this.options.waitforInterval,
        reverse = false,
        timeoutMsg = `element ("${this.selector}") still ${reverse ? '' : 'not '}displayed after ${timeout}ms`
    }: WaitForOptions = {}
) {
    return this.waitUntil(
        async () => reverse !== await this.isDisplayed(),
        { timeout, interval, timeoutMsg }
    )
}
