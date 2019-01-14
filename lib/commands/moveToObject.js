/**
 *
 * Move the mouse by an offset of the specified element. If an element is provided but no
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

import findMoveToCoordinates from '../helpers/findMoveToCoordinates'

let moveToObject = function (selector, xoffset, yoffset) {
    if (this.isMobile) {
        return findMoveToCoordinates(selector, xoffset, yoffset).then(res => this.touchMove(res.x, res.y))
    }

    return this.moveTo(selector, xoffset, yoffset)
}

export default moveToObject
