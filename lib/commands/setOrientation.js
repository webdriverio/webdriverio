/**
 *
 * Set the current browser orientation.
 *
 * <example>
    :setOrientation.js
    client
        .setOrientation('landscape')
        .getOrientation(function(err, orientation) {
            console.log(orientation); // outputs: "landscape"
        })
        .end();
 * </example>
 *
 * @param {String} orientation the new browser orientation (`landscape/portrait`)
 *
 * @uses protocol/orientation
 * @type mobile
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function setOrientation (orientation) {

    /*!
     * parameter check
     */
    if(typeof orientation !== 'string') {
        throw new ErrorHandler.CommandError('number or type of arguments don\'t agree with setOrientation command');
    }

    return this.orientation(orientation.toUpperCase());

};