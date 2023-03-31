import Timer from '../../utils/Timer.js'
import type { WaitUntilOptions } from '../../types.js'

/**
 * This wait command is your universal weapon if you want to wait on something. It expects a condition
 * and waits until that condition is fulfilled with a truthy value to be returned.
 *
 * A common example is to wait until a certain element contains a certain text (see example).
 *
 * @alias browser.waitUntil
 * @param {Function}          condition  condition to wait on until returning a truthy value
 * @param {WaitUntilOptions=} options    command options
 * @param {Number=}           options.timeout     timeout in ms (default: 5000)
 * @param {String=}           options.timeoutMsg  error message to throw when waitUntil times out
 * @param {Number=}           options.interval    interval between condition checks (default: 500)
 * @return {Boolean} true if condition is fulfilled
 * @uses utility/pause
 * @example https://github.com/webdriverio/example-recipes/blob/0bfb2b8d212b627a2659b10f4449184b657e1d59/waitUntil/index.html#L3-L8
 * @example https://github.com/webdriverio/example-recipes/blob/0bfb2b8d212b627a2659b10f4449184b657e1d59/waitUntil/waitUntilExample.js#L6-L14
 * @type utility
 *
 */
export function waitUntil<ReturnValue>(
    this: WebdriverIO.Browser | WebdriverIO.Element,
    condition: () => ReturnValue | Promise<ReturnValue>,
    {
        timeout = this.options.waitforTimeout,
        interval = this.options.waitforInterval,
        timeoutMsg
    }: Partial<WaitUntilOptions> = {}
): Promise<Exclude<ReturnValue, boolean>> {
    if (typeof condition !== 'function') {
        throw new Error('Condition is not a function')
    }

    /**
     * ensure that timeout and interval are set properly
     */
    if (typeof timeout !== 'number') {
        timeout = this.options.waitforTimeout as number
    }

    if (typeof interval !== 'number') {
        interval = this.options.waitforInterval as number
    }

    const fn = condition.bind(this)
    const timer = new Timer(interval as number, timeout as number, fn, true)
    return (timer as any).catch((e: Error) => {
        if (e.message === 'timeout') {
            if (typeof timeoutMsg === 'string') {
                throw new Error(timeoutMsg)
            }
            throw new Error(`waitUntil condition timed out after ${timeout}ms`)
        }

        throw new Error(`waitUntil condition failed with the following reason: ${(e && e.message) || e}`)
    })
}
