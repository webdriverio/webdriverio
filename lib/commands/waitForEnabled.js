/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (dis/en)abled. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is (dis/en)abled.
 *
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 *
 * @uses action/selectorExecuteAsync, protocol/timeoutsAsyncScript
 * @type utility
 *
 */

let waitForEnabled = function (selector, ms, reverse) {
    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout
    }

    if (typeof reverse !== 'boolean') {
        reverse = false
    }

    return this.waitUntil(() =>
        this.isEnabled(selector)
    ) .then((isEnabled) => {
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
    }, ms).catch(() => {
        let isReversed = reverse ? '' : 'not'
        throw new Error(`element (${selector}) still ${isReversed} enabled after ${ms}ms`)
    })
}

export default waitForEnabled
