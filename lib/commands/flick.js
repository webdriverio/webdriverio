/**
 *
 * Perform a flick on the screen or an element. If you want to flick on a specific
 * element make sure you provide a selector argument. If not just pass `xoffset`
 * and `yoffset` as command arguments.
 *
 * start at a particulat screen location
 *
 * @param {String=} selector   element to flick on
 * @param {Number=} xoffset    x offset of flick gesture (in pixels or relative units)
 * @param {Number=} yoffset    y offset of flick gesture (in pixels or relative units)
 * @param {Number=} speed      time (in seconds) to spend performing the flick
 *
 * @uses protocol/element, protocol/touchFlick
 * @type mobile
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function flick (selector, xoffset, yoffset, speed) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var self = this,
        response = {};

    /*!
     * mobile check
     */
    if(!this.isMobile) {
        return callback(new ErrorHandler.CommandError('flick command is not supported on non mobile platforms'));
    }

    if(arguments.length === 3 && typeof selector === 'number' && typeof xoffset === 'number') {

        /*!
         * you don't care where the flick starts on the screen
         */

        var xspeed = arguments[0],
            yspeed = arguments[1];

        async.waterfall([
            function(cb) {
                self.touchFlick(xspeed, yspeed, cb);
            },
            function(res, cb) {
                response.touchFlick = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    } else {

        /*!
         * command starts at a particular screen location
         */

        async.waterfall([
            function(cb) {
                self.element(selector, cb);
            },
            function(res, cb) {
                response.element = res;

                if(!res.value.ELEMENT) {
                    return callback(null, null, response);
                }

                self.touchFlick(res.value.ELEMENT.toString(), xoffset, yoffset, speed, cb);
            },
            function(res, cb) {
                response.touchFlick = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    }

};

