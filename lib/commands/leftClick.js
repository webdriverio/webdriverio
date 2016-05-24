/**
 *
 * Apply left click on an element. If selector is not provided, click on the last
 * moved-to location.
 *
 * @param {String} selector element to click on
 * @uses protocol/element, protocol/buttonPress
 * @type action
 *
 */

import handleMouseButtonCommand from '../helpers/handleMouseButtonCommand'

let leftClick = function (selector, xoffset, yoffset) {
    return handleMouseButtonCommand.call(this, selector, 'left', xoffset, yoffset)
}

export default leftClick
