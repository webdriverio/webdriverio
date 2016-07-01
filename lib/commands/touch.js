/**
 * Put finger on an element (only in mobile context).
 *
 * @alias browser.touch
 * @param {String}  selector  element to put finger on
 * @param {Boolean} longClick if true touch click will be long (default: false)
 * @uses property/getLocation, protocol/touchClick
 * @type mobile
 * @uses android
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let touch = function (selector, longClick) {
    /**
     * we can't use default values for function parameter here because this would
     * break the ability to chain the command with an element if reverse is used
     */
    longClick = typeof longClick === 'boolean' ? longClick : false

    if (!this.isMobile) {
        throw new CommandError('touch command is not supported on non mobile platforms')
    }

    const touchCommand = longClick ? 'touchLongClick' : 'touchClick'

    return this.getLocation(selector).then((val) =>
        this[touchCommand](val.x, val.y))
}

export default touch
