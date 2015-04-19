/**
 *
 * Release touch sequenz on specific element.
 *
 * @param {String} selector element to release on
 * @callbackParameter error
 *
 * @uses property/getLocation, protocol/touchUp
 * @type mobile
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function release (selector) {

    /*!
     * compatibility check
     */
    if(!this.isMobile) {
        throw new ErrorHandler.CommandError('release command is not supported on non mobile platforms');
    }

    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with release command');
    }

    return this.getLocation(selector).then(function(res) {
        return this.touchUp(res.x, res.y);
    });

};