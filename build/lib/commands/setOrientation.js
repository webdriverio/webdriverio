/**
 *
 * Set the current browser orientation.
 *
 * <example>
    :setOrientationAsync.js
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
 * @for android, ios
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var setOrientation = function setOrientation(orientation) {
    /*!
     * parameter check
     */
    if (typeof orientation !== 'string') {
        throw new _utilsErrorHandler.CommandError('number or type of arguments don\'t agree with setOrientation command');
    }

    return this.orientation(orientation.toUpperCase());
};

exports['default'] = setOrientation;
module.exports = exports['default'];
