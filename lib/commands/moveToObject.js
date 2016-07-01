/**
 *
 * Move the mouse by an offset of the specificed element. If an element is provided but no
 * offset, the mouse will be moved to the center of the element. If the element is not
 * visible, it will be scrolled into view.
 *
 * @alias browser.moveToObject
 * @param {String} selector element to move to
 * @param {Number} xoffset  X offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 * @param {Number} yoffset  Y offset to move to, relative to the top-left corner of the element. If not specified, the mouse will move to the middle of the element.
 * @uses protocol/element, protocol/elementIdLocation
 * @type action
 *
 */

import { RuntimeError } from '../utils/ErrorHandler'

let moveToObject = function (selector, xoffset, yoffset) {
    /**
     * check for offset params
     */
    var hasOffsetParams = true
    if (typeof xoffset !== 'number' && typeof yoffset !== 'number') {
        hasOffsetParams = false
    }

    if (this.isMobile) {
        return this.element(selector).then((res) => {
            /**
             * check if element was found and throw error if not
             */
            if (!res.value) {
                throw new RuntimeError(7)
            }

            return this.elementIdSize(res.value.ELEMENT).then((size) =>
                this.elementIdLocation(res.value.ELEMENT).then((location) => {
                    return { size, location }
                })
            )
        }).then((res) => {
            let x = res.location.value.x + (res.size.value.width / 2)
            let y = res.location.value.y + (res.size.value.height / 2)

            if (hasOffsetParams) {
                x = res.location.value.x + xoffset
                y = res.location.value.y + yoffset
            }

            return this.touchMove(x, y)
        })
    }

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
