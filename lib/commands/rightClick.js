/**
 *
 * Apply right click on an element. If selector is not provided, click on the last
 * moved-to location.
 *
 * @alias browser.rightClick
 * @param {String} selector element to click on
 * @param {Number} xoffset  X offset to move to, relative to the top-left corner of the element.
 * @param {Number} yoffset  Y offset to move to, relative to the top-left corner of the element.
 * @uses protocol/element, protocol/buttonPress
 * @type action
 *
 */

import handleMouseButtonCommand from '../helpers/handleMouseButtonCommand'

let rightClick = function (selector, xoffset, yoffset) {
    return handleMouseButtonCommand.call(this, selector, 'right', xoffset, yoffset)
}

export default rightClick
