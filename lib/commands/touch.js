/**
 * Put finger on an element (only in mobile context).
 *
 * @param {String}  selector  element to put finger on
 * @param {Boolean} longClick if true touch click will be long (default: false)
 *
 * @uses property/getLocation, protocol/touchClick
 * @type mobile
 * @uses android
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let touch = function (selector, longClick = false) {
    if (!this.isMobile) {
        throw new CommandError('touch command is not supported on non mobile platforms')
    }

    const touchCommand = longClick ? 'touchLongClick' : 'touchClick'

    return this.getLocation(selector).then((val) =>
        this[touchCommand](val.x, val.y))
}

export default touch
