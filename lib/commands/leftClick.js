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

var handleMouseButtonCommand = require('../helpers/handleMouseButtonCommand');

module.exports = function leftClick (selector) {
    return handleMouseButtonCommand.call(this, selector, 'left');
};