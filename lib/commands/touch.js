/**
 * Put finger on an element (only in mobile context).
 *
 * @alias browser.touch
 * @param {String}  selector  element to put finger on
 * @param {Boolean} longClick if true touch click will be long (default: false)
 * @uses protocol/element, protocol/touchClick, protocol/touchLongClick
 * @type mobile
 * @uses android
 *
 */

import { RuntimeError } from '../utils/ErrorHandler'

export default function touch (selector, longClick) {
    /**
     * we can't use default values for function parameter here because this would
     * break the ability to chain the command with an element if reverse is used
     */
    longClick = typeof longClick === 'boolean' ? longClick : false

    const touchCommand = longClick ? 'touchLongClick' : 'touchClick'

    return this.element(selector).then((elem) => {
        /**
         * check if element was found and throw error if not
         */
        if (!elem.value) {
            throw new RuntimeError(7)
        }

        return this[touchCommand](elem.value.ELEMENT)
    })
}
