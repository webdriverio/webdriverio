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

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function hold (selector) {

    /*!
     * compatibility check
     */
    if(!this.isMobile) {
        throw new ErrorHandler.CommandError('hold command is not supported on non mobile platforms');
    }

    return this.element(selector).then(function(res) {
        return this.touchLongClick(res.value.ELEMENT);
    });

};