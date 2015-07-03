/**
 *
 * Put finger on an element (only in mobile context).
 *
 * @param {String} selector element to put finger on
 *
 * @uses property/getLocation, protocol/touchDown
 * @type mobile
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function touch (selector) {

    if(!this.isMobile) {
        throw new ErrorHandler.CommandError('touch command is not supported on non mobile platforms');
    }

    return this.getLocation(selector).then(function(val) {
        return this.touchDown(val.x, val.y);
    });

};