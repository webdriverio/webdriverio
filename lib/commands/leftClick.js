/**
 *
 * Apply left click on an element. If selector is not provided, click on the last
 * moved-to location.
 *
 * @alias browser.leftClick
 * @param {String} selector element to click on
 * @param {Number} xoffset  X offset to move to, relative to the top-left corner of the element.
 * @param {Number} yoffset  Y offset to move to, relative to the top-left corner of the element.
 * @uses protocol/element, protocol/buttonPress
 * @type action
 *
 */

import handleMouseButtonCommand from '../helpers/handleMouseButtonCommand'

let leftClick = function (selector, xoffset, yoffset) {
    return handleMouseButtonCommand.call(this, selector, 'left', xoffset, yoffset)
}

export default leftClick
