/**
 *
 * Waits for the current page url to match the provided value.
 * It's useful when you have a redirection and need to wait for the final url
 * to be loaded, before running you're next command.
 *
 * <example>
    :waitForUrlExample.js
    it('should detect the expected url', function () {
        browser.waitForValue('https://example.com');
    });
 * </example>
 *
 * @alias browser.waitForUrl
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 * @returns {Boolean}
 * @uses util/waitUntil, property/getUrl
 * @type utility
 *
 */

import { WaitUntilTimeoutError, isTimeoutError } from '../utils/ErrorHandler'

let waitForUrl = function (url, ms, reverse) {
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
        return this.getUrl().then((value) => {
            return value && value === url && !reverse
        })
    }, ms).catch((e) => {
        if (isTimeoutError(e)) {
            let isReversed = reverse ? 'with' : 'without'
            throw new WaitUntilTimeoutError(`url (${url}) still ${isReversed} expected value after ${ms}ms`)
        }
        throw e
    })
}

export default waitForUrl
