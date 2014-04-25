/* global window */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function scroll (selector, xoffset, yoffset) {

    /**
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    xoffset = typeof xoffset === 'number' ? xoffset : 0;
    yoffset = typeof yoffset === 'number' ? yoffset : 0;

    if(typeof selector === 'number' && typeof xoffset === 'number') {
        yoffset = xoffset;
        xoffset = selector;
        selector = null;
    }

    var self = this,
        response = {},
        scrollFunc = function(x,y) {
            return window.scrollTo(x,y);
        };

    if(selector) {

        /**
         * scroll to specific element
         */

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

                    /* istanbul ignore next */
                    self.execute(scrollFunc, [res.value.x + xoffset, res.value.y + yoffset], cb);
                },
                function(res, cb) {
                    response.execute = res;
                    cb();
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
                    self.touchScroll(res.value.ELEMENT, xoffset, yoffset, cb);
                },
                function(res, cb) {
                    response.touchScroll = res;
                    cb();
                }
            ], function(err) {

                callback(err, null, response);

            });

        }

    } else {

        /**
         * scroll to x and y position
         */

        if(this.desiredCapabilities.browserName || this.desiredCapabilities.app === 'safari') {

            /**
             * hybrid mode
             */

            async.waterfall([
                function(cb) {
                    /* istanbul ignore next */
                    self.execute(scrollFunc, [xoffset,yoffset], cb);
                },
                function(res, cb) {
                    response.execute = res;
                    cb();
                }
            ], function(err) {
                callback(err, null, response);
            });

        } else {

            /**
             * native mode - not supported yes
             */
            /* istanbul ignore next */
            return typeof callback(new ErrorHandler.CommandError('Scrolling to specified x and y position isn\'t supported yet'));

        }

    }
};

