/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (dis/en)abled. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is (dis/en)abled.
 *
 * @alias browser.waitForEnabled
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @uses util/waitUntil, property/isEnabled
 * @type utility
 *
 */

import { WaitUntilTimeoutError, isTimeoutError } from '../utils/ErrorHandler'

let waitForEnabled = function (selector, ms, reverse) {
    /**
     * we can't use default values for function parameter here because this would
     * break the ability to chain the command with an element if reverse is used, like
     *
     * ```js
     * var elem = browser.element('#elem');
     * elem.waitForXXX(10000, true);
     * ```
     */
    reverse = typeof reverse === 'boolean' ? reverse : false

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout
    }

    return this.waitUntil(() => {
        return this.isEnabled(selector).then((isEnabled) => {
            if (!Array.isArray(isEnabled)) {
                return isEnabled !== reverse
            }

            var result = reverse
            for (let val of isEnabled) {
                if (!reverse) {
                    result = result || val
                } else {
                    result = result && val
                }
            }

            return result !== reverse
        })
    }, ms).catch((e) => {
        if (isTimeoutError(e)) {
            let isReversed = reverse ? '' : 'not'
            throw new WaitUntilTimeoutError(`element (${selector}) still ${isReversed} enabled after ${ms}ms`)
        }
        throw e
    })
}

export default waitForEnabled
