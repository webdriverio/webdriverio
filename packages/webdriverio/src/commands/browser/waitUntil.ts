import { getBrowserObject } from '@wdio/utils'
import type { WebDriverResultEvent } from 'webdriver'

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
 * @param {Number=}           options.timeout     time in ms (default set based on [`waitforTimeout`](/docs/configuration#waitfortimeout) config value)
 * @param {String=}           options.timeoutMsg  error message to throw when waitUntil times out
 * @param {Number=}           options.interval    interval between condition checks (default set based on [`waitforInterval`](/docs/configuration#waitforinterval) config value)
 * @return {Boolean} true if condition is fulfilled
 * @uses utility/pause
 * @example https://github.com/webdriverio/example-recipes/blob/0bfb2b8d212b627a2659b10f4449184b657e1d59/waitUntil/index.html#L3-L8
 * @example https://github.com/webdriverio/example-recipes/blob/0c9252b0a4f7e18a34cece74e5798c1fe464c120/waitUntil/waitUntilExample.js#L16-L24
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
): Promise<Exclude<ReturnValue, false | 0 | '' | null | undefined>> {
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

    /**
     * abort the Timer if the session is deleted during the wait
     */
    const browser = getBrowserObject(this)
    const abort = new AbortController()
    const abortOnSessionEnd = (result: WebDriverResultEvent) => {
        if (result.command === 'deleteSession') {
            abort.abort()
        }
    }
    browser.on('result', abortOnSessionEnd)

    const fn = condition.bind(this)
    const timer = new Timer(interval as number, timeout as number, fn, true, abort.signal)
    return timer.catch<Exclude<ReturnValue, false | 0 | '' | null | undefined>>((e: Error) => {
        if (e.message === 'timeout') {
            if (typeof timeoutMsg === 'function') {
                throw new Error(timeoutMsg())
            }
            if (typeof timeoutMsg === 'string') {
                throw new Error(timeoutMsg)
            }
            throw new Error(`waitUntil condition timed out after ${timeout}ms`)
        }

        const err = new Error(`waitUntil condition failed with the following reason: ${e && e.message || e}`)
        const origStack = e.stack
        if (!origStack || !err.stack) {
            throw err
        }

        /**
         * sanitize error message and clean up stack trace
         */
        const [errMsg, ...waitUntilErrorStackLines] = err.stack.split('\n')
        err.stack = [
            errMsg,
            ...(origStack.split('\n').slice(1)),
            '    ---',
            ...waitUntilErrorStackLines
        ].filter((errorLine) => (
            !errorLine.includes('/node_modules/webdriverio/') &&
            !errorLine.includes('/node_modules/@wdio/')
        )).join('\n')

        throw err
    }).finally(() => {
        browser.off('result', abortOnSessionEnd)
    })
}
