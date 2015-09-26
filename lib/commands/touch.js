/**
 *
 * Put finger on an element (only in mobile context).
 *
 * @param {String} selector element to put finger on
 *
 * @uses property/getLocation, protocol/touchDown
 * @type mobile
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let touch = function (selector) {
    if (!this.isMobile) {
        throw new CommandError('touch command is not supported on non mobile platforms')
    }

    return this.getLocation(selector).then((val) =>
        this.touchDown(val.x, val.y))
}

export default touch
