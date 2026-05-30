import type { WaitForOptions } from '../../types.js'

interface WaitForDisplayedParams extends WaitForOptions {
    /**
     * `true` to check if the element is within the viewport. false by default.
     */
    withinViewport?: boolean
    /**
     * `true` to check if the element content-visibility property has (or inherits) the value auto,
     * and it is currently skipping its rendering. `true` by default.
     * @default true
     */
    contentVisibilityAuto?: boolean
    /**
     * `true` to check if the element opacity property has (or inherits) a value of 0. `true` by default.
     * @default true
     */
    opacityProperty?: boolean
    /**
     * `true` to check if the element is invisible due to the value of its visibility property. `true` by default.
     * @default true
     */
    visibilityProperty?: boolean
}

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
 * @param {WaitForOptions=}  options                waitForDisplayed options (optional)
 * @param {Number=}          options.timeout        time in ms (default set based on [`waitforTimeout`](/docs/configuration#waitfortimeout) config value)
 * @param {Boolean=}         options.reverse        if true it waits for the opposite (default: false)
 * @param {String=}          options.timeoutMsg     if exists it overrides the default error message
 * @param {Number=}          options.interval       interval between checks (default: `waitforInterval`)
 * @param {Boolean=}         options.withinViewport set to `true` to wait until element is displayed within viewport (default: `false`)
 * @param {Boolean=}         options.contentVisibilityAuto set to `true` to check if the element content-visibility property has (or inherits) the value auto, and it is currently skipping its rendering. `true` by default.
 * @param {Boolean=}         options.opacityProperty set to `true` to check if the element opacity property has (or inherits) a value of 0. `true` by default.
 * @param {Boolean=}         options.visibilityProperty set to `true` to check if the element is invisible due to the value of its visibility property. `true` by default.
 * @return {Boolean} true    if element is displayed (or doesn't if flag is set)
 * @uses utility/waitUntil, state/isDisplayed
 * @example https://github.com/webdriverio/example-recipes/blob/0bfb2b8d212b627a2659b10f4449184b657e1d59/waitForDisplayed/index.html#L3-L8
 * @example https://github.com/webdriverio/example-recipes/blob/9ac16b4d4cf4bc8ec87f6369439a2d0bcaae4483/waitForDisplayed/waitForDisplayedExample.js#L6-L14
 * @type utility
 */
export function waitForDisplayed (
    this: WebdriverIO.Element,
    {
        timeout = this.options.waitforTimeout,
        interval = this.options.waitforInterval,
        reverse = false,
        withinViewport = false,
        contentVisibilityAuto = true,
        opacityProperty = true,
        visibilityProperty = true,
        timeoutMsg = `element ("${this.selector}") still ${reverse ? '' : 'not '}displayed${withinViewport ? ' within viewport' : ''} after ${timeout}ms`,
    }: WaitForDisplayedParams = {}
) {

    return this.waitUntil(
        async () => reverse !== await this.isDisplayed({ withinViewport, contentVisibilityAuto, opacityProperty, visibilityProperty }),
        { timeout, interval, timeoutMsg }
    )
}
