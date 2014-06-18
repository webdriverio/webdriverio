/**
 *
 * Scroll to a specific element. You can also append/pass two offset values as parameter
 * to scroll to a specific position.
 *
 * ### Usage
 *
 *     // scroll to specific element
 *     client.scroll('#myElement');
 *
 *     // scroll to specific element with offset
 *     // scroll offset will be added to elements position
 *     client.scroll('#myElement', 100);
 *     client.scroll('#myElement', 100, 200);
 *
 *     // scroll to specific x and y position
 *     client.scroll(0, 250);
 *
 * @param {String=|Number} selector|xoffset element  or x position to scroll to
 * @param {Number}         xoffset|yoffset  x offset or y position to scroll to
 * @param {Number}         yoffset          y offset to scroll to
 *
 * @uses protocol/element, protocol/elementIdLocation, protocol/touchScroll, protocol/execute
 * @type utility
 *
 */

/* global window */

var async = require('async');

module.exports = function scroll (selector, xoffset, yoffset) {

    /*!
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

    if(this.isMobile) {

        async.waterfall([
            function(cb) {

                if(!selector) {
                    return cb();
                }

                self.element(selector, cb);
            },
            function(res) {

                var cb = arguments[arguments.length - 1];

                if(typeof res !== 'function') {
                    selector = res.value.ELEMENT;
                    response.element = res;
                }

                self.touchScroll(selector, xoffset, yoffset, cb);
            },
            function(res, cb) {
                response.touchScroll = res;
                cb();
            }
        ], function(err) {

            callback(err, null, response);

        });

    } else {

        if(selector) {

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
                    self.execute(scrollFunc, res.value.x + xoffset, res.value.y + yoffset, cb);
                },
                function(res, cb) {
                    response.execute = res;
                    cb();
                }
            ], function(err) {

                callback(err, null, response);

            });

        } else {

            async.waterfall([
                function(cb) {
                    /* istanbul ignore next */
                    self.execute(scrollFunc, xoffset, yoffset, cb);
                },
                function(res, cb) {
                    response.execute = res;
                    cb();
                }
            ], function(err) {
                callback(err, null, response);
            });

        }

    }
};

