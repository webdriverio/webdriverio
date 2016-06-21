/**
 *
 * Perform a swipe on the screen or an element. If you want to swipe on a specific
 * element make sure you provide a selector argument. If not just pass `xoffset`
 * and `yoffset` as command arguments.
 *
 * start at a particulat screen location
 *
 * @alias browser.swipe
 * @param {String=} selector   element to swipe on
 * @param {Number=} xoffset    x offset of swipe gesture (in pixels or relative units)
 * @param {Number=} yoffset    y offset of swipe gesture (in pixels or relative units)
 * @param {Number=} speed      time (in seconds) to spend performing the swipe
 * @uses protocol/element, protocol/touchFlick
 * @type mobile
 *
 */

import { CommandError, RuntimeError } from '../utils/ErrorHandler'

let swipe = function (selector, xoffset, yoffset, speed) {
    /*!
     * mobile check
     */
    if (!this.isMobile) {
        throw new CommandError('swipe command is not supported on non mobile platforms')
    }

    if (arguments.length === 2 && typeof selector === 'number' && typeof xoffset === 'number') {
        /*!
         * you don't care where the swipe starts on the screen
         */
        let xspeed = selector
        let yspeed = xoffset

        return this.touchFlick(xspeed, yspeed)
    }

    /*!
     * command starts at a particular screen location
     */
    return this.element(selector).then((res) => {
        /**
         * check if element was found and throw error if not
         */
        if (!res.value) {
            throw new RuntimeError(7)
        }

        return this.touchFlick(res.value.ELEMENT.toString(), xoffset, yoffset, speed)
    })
}

export default swipe
