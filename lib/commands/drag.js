var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js'),
    isMobileHelper = require('../helpers/isMobile');

module.exports = function swipe (selector, startX, startY, endX, endY, touchCount, duration) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /**
     * set parameters properly
     */
    if(arguments.length === 2 && typeof startX === 'function') {
        startX = null;
    } else if(arguments.length === 3 && typeof startY === 'function') {
        startY = null;
    } else if(arguments.length === 4 && typeof endX === 'function') {
        endX = null;
    } else if(arguments.length === 5 && typeof endY === 'function') {
        endY = null;
    } else if(arguments.length === 6 && typeof touchCount === 'function') {
        touchCount = null;
    } else if(arguments.length === 7 && typeof duration === 'function') {
        duration = null;
    }

    var self = this,
        response = {},
        xOffset  = 0,
        yOffset  = 0,
        isMobile = isMobileHelper(this.desiredCapabilities);

    if(startX && endX) {
        xOffset = Math.abs(startX - endX);
        yOffset = Math.abs(startY - endY);
    }

    if(!isMobile) {
        return callback(new ErrorHandler.CommandError('swipe command is not supported on non mobile platforms'));
    }

    if(typeof selector === 'string') {

        if(this.desiredCapabilities.browserName || this.desiredCapabilities.app === 'safari') {

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

                    var location = response.elementIdLocation.value,
                        size = response.elementIdSize.value;

                    startX = startX <= 1 ? location.x + (startX * size.width ) : startX;
                    startY = startY <= 1 ? location.y + (startY * size.height) : startY;
                    endX   = endX   <= 1 ? location.x + (endX   * size.width ) : endX;
                    endY   = endY   <= 1 ? location.y + (endY   * size.height) : endY;

                    self.touchSwipe(touchCount, startX, startY, endX, endY, duration, null, cb);
                },
                function(res,cb) {
                    response.touchSwipe = res;
                    cb();
                }
            ], function(err) {

                callback(err, null, response);

            });

        } else {

            async.waterfall([
                function(cb) {
                    self.element(selector, cb);
                },
                function(res, cb) {
                    response.element = res;
                    self.touchSwipe(touchCount, startX, startY, endX, endY, duration, res.value.ELEMENT, cb);
                },
                function(res, cb) {
                    response.touchSwipe = res;
                    cb();
                }
            ], function(err) {

                callback(err, null, response);

            });

        }

    } else {

        // swipe gesture on native or web element without given selector
        this.touchSwipe(touchCount, startX, startY, endX, endY, duration, null, callback);

    }

};

