/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be present within the DOM. Returns true if the selector
 * matches at least one element that exists in the DOM. If the reverse flag
 * is true, the command will instead return true if the selector does not
 * match any elements.
 *
 * @param {String}   selector CSS selector to query
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it instead waits for the selector to not match any elements (default: false)
 *
 * @uses utility/waitUntil, state/isExisting
 * @type utility
 *
 */

import { WaitForTimeoutError, isTimeoutError } from '../utils/ErrorHandler'

let waitForExist = function (selector, ms, reverse) {
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
        return this.isExisting(selector).then((isExisting) => {
            if (!Array.isArray(isExisting)) {
                return isExisting !== reverse
            }

            let result = reverse
            for (let val of isExisting) {
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
            let isReversed = reverse ? '' : 'not '
            throw new WaitForTimeoutError(`element (${selector}) still ${isReversed}existing after ${ms}ms`)
        }
        throw e
    })
}

export default waitForExist
