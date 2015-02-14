/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be present within the DOM. Returns true if the selector
 * matches at least one element. If the reverse flag is true, the command will
 * instead return true if the selector does not match any elements.
 *
 * @param {String}   selector CSS selector to query
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it instead waits for the selector to not match any elements (default: false)
 * @callbackParameter error, isExisting
 *
 * @type utility
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function waitForExist(selector, ms, reverse) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if (typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with waitForExist command'));
    }

    /*!
     * ensure that ms is set properly
     */
    if (typeof ms !== 'number') {
        ms = this.options.waitforTimeout;
    }

    if (typeof reverse !== 'boolean') {
        reverse = false;
    }

    var self = this,
        response = {
            elements: []
        },
        start = new Date().getTime();

    function repeater() {

        async.waterfall([
            function(cb) {
                self.pause(250).elements(selector, cb);
            },
            function(res, cb) {
                response.elements.push(res);

                if (res && res.value) {
                    var isExistent = res.value.length > 0;
                    if ((!reverse && isExistent) || (reverse && !isExistent)) {
                        return cb(null, true);
                    }
                }

                var now = new Date().getTime();
                if(now - start > ms) {
                    return cb(new ErrorHandler(reverse ? 100 : 7), reverse);
                }

                return cb();

            }
        ], function(err, res) {

            if(!err && typeof res !== 'boolean') {
                return repeater();
            }

            callback(err, res, response);

        });

    }

    repeater();

};
