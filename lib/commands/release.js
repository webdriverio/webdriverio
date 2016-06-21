/**
 *
 * Release touch sequenz on specific element.
 *
 * @alias browser.release
 * @param {String} selector element to release on
 * @uses property/getLocation, protocol/touchUp
 * @type mobile
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let release = function (selector) {
    /*!
     * compatibility check
     */
    if (!this.isMobile) {
        throw new CommandError('release command is not supported on non mobile platforms')
    }

    return this.getLocation(selector).then(
        (res) => this.touchUp(res.x, res.y))
}

export default release
