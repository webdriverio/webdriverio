var async = require('async'),
    isMobileHelper = require('../helpers/isMobile'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function tap (selector, x, y, tapCount, touchCount, duration) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * set parameters properly
     */
    if(arguments.length === 2 && typeof x === 'function') {
        x = null;
    } else if(arguments.length === 3 && typeof y === 'function') {
        y = null;
    } else if(arguments.length === 4 && typeof tapCount === 'function') {
        tapCount = null;
    } else if(arguments.length === 5 && typeof touchCount === 'function') {
        touchCount = null;
    } else if(arguments.length === 6 && typeof duration === 'function') {
        duration = null;
    }

    /**
     * parameter check
     */
    if(typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with tap command'));
    }

    if(!isMobileHelper(this.desiredCapabilities)) {
        return callback(new ErrorHandler.CommandError('tap command is not supported on non mobile platforms'));
    }

    var self = this,
        response = {};

    if(typeof selector === 'string' && selector !== '') {

        if(this.desiredCapabilities.browserName || this.desiredCapabilities.app === 'safari') {

            /**
             * hybrid mode
             */

            async.waterfall([
                function(cb) {
                    self.element(selector, cb);
                },
                function(res, cb) {
                    response.element = res;
                    self.elementIdLocation(res.value.ELEMENT, cb);
                },
                function(res, cb) {
                    response.elementIdLocation = res;
                    self.elementIdSize(response.element.value.ELEMENT, cb);
                },
                function(res, cb) {
                    response.elementIdSize = res;
                    self.scroll(0, response.elementIdLocation.value.y - 100, cb);
                },
                function(val, res, cb) {
                    response.scroll = res;

                    var location = response.elementIdLocation.value,
                        size     = response.elementIdSize.value;

                    self.touchTap(tapCount, touchCount, duration, location.x + (size.width / 2), location.y + (size.height / 2), null, cb);
                },
                function(res, cb) {
                    response.touchTap = res;
                    self.pause(250, cb);
                }
            ], function(err) {

                callback(err, null, response);

            });

        } else {

            /**
             * native mode
             */

            async.waterfall([
                function(cb) {
                    self.element(selector, cb);
                },
                function(res, cb) {
                    response.element = res;
                    self.touchTap(tapCount, touchCount, duration, x, y, res.value.ELEMENT, cb);
                },
                function(res, cb) {
                    response.touchTap = res;
                    cb();
                }
            ], function(err) {

                callback(err, null, response);

            });

        }

    } else {

        async.waterfall([
            function(cb) {
                self.touchTap(tapCount, touchCount, duration, x, y, null, cb);
            },
            function(res, cb) {
                response.touchTap = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    }

};