/**
 *
 * Long press on an element using finger motion events. This command works only in a
 * mobile context.
 *
 * @param {String} selector element to hold on
 * @uses protocol/element, protocol/touchLongClick
 * @type mobile
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let hold = function (selector) {
    /*!
     * compatibility check
     */
    if (!this.isMobile) {
        throw new CommandError('hold command is not supported on non mobile platforms')
    }

    return this.element(selector).then((res) => this.touchLongClick(res.value.ELEMENT))
}

export default hold
