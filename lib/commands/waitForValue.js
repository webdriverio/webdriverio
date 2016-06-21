/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to have a value. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element has a value.
 *
 * @alias browser.waitForValue
 * @param {String}   selector element to wait
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @uses util/waitUntil, property/getValue
 * @type utility
 *
 */

let waitForValue = function (selector, ms, reverse) {
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
    const isReversed = reverse ? 'with' : 'without'

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout
    }

    return this.waitUntil(() => {
        return this.getValue(selector).then((value) => {
            if (!Array.isArray(value)) {
                return (value !== '') !== reverse
            }

            let result = reverse
            for (let val of value) {
                if (!reverse) {
                    result = result || val !== ''
                } else {
                    result = result && val === ''
                }
            }

            return result !== reverse
        })
    }, ms, `element (${selector}) still ${isReversed} a value after ${ms}ms`)
}

export default waitForValue
