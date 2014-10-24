/**
 *
 * Release touch sequenz on specific element.
 *
 * @param {String} selector element to release on
 * @uses property/getLocation, protocol/touchUp
 * @type mobile
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function release (selector) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * compatibility check
     */
    if(!this.isMobile) {
        return callback(new ErrorHandler.CommandError('release command is not supported on non mobile platforms'));
    }
    /*!
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with release command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.getLocation(selector, cb);
        },
        function(res, cb) {
            response.getLocation = res;
            self.touchUp(res.x, res.y, cb);
        },
        function(res, cb) {
            response.touchUp = res;
            cb();
        }
    ], function(err) {

        callback(err, null, response);

    });

};