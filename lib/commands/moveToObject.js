/**
 *
 * Move the mouse by an offset of the specified element. If an element is provided but no
 * offset, the mouse will be moved to the center of the element. If the element is not
 * visible, it will be scrolled into view.
 *
 * Uses JSONWireframe moveTo protocol with W3C actions protocol fallback.
 * Uses touchMove protocol for mobile.
 *
 * @alias browser.moveToObject
 * @param {String} selector element to move to
 * @param {Number} xoffset  X offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 * @param {Number} yoffset  Y offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 * @uses protocol/element, protocol/elementIdLocation, protocol/elementIdSize
 * @type action
 *
 */
import { RuntimeError } from '../utils/ErrorHandler'

let moveToObject = function (selector, xoffset, yoffset) {
    return this.element(selector).then((res) => {
        /**
         * check if element was found and throw error if not
         */
        if (!res.value) {
            throw new RuntimeError(7)
        }

        return this.moveTo(res.value.ELEMENT, xoffset, yoffset)
    })
}

export default moveToObject
