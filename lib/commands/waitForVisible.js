/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (in)visible. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is visible.
 *
 * This function checks for visibility using window.getComputedStyle. An
 * element will be considered invisible if its visibility is 'hidden', its
 * display is 'none', its opacity is 0 or its x/y coordinates are not
 * within the viewport.
 *
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 *
 * @uses protocol/selectorExecuteAsync, protocol/timeoutsAsyncScript
 * @type utility
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let waitForVisible = function (selector, ms, reverse = false) {
    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout
    }

    return this.waitUntil(() => {
        return this.isVisible(selector).then((isVisible) => {
            if (!Array.isArray(isVisible)) {
                return isVisible !== reverse
            }

            let result = reverse
            for (let val of isVisible) {
                if (!reverse) {
                    result = result || val
                } else {
                    result = result && val
                }
            }

            return result !== reverse
        })
    }, ms).catch((e) => {
        if (e.message === 'Promise never resolved with an truthy value') {
            let isReversed = reverse ? '' : 'not'
            throw new CommandError(`element (${selector}) still ${isReversed} visible after ${ms}ms`)
        }
        throw e
    })
}

export default waitForVisible
