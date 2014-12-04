/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be existent within DOM. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is visible.
 *
 * @param {String}   selector element to wait for
 * @param {Number=}  ms       time in ms (default: 500)
 * @param {Boolean=} reverse  if true it waits for the opposite (default: false)
 *
 * @uses action/selectorExecuteAsync, protocol/timeoutsAsyncScript
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

                var isExistent = res.value.length > 0;
                if(res && res.value && ((!reverse && isExistent) || (reverse && !isExistent))) {
                    return cb(null, true);
                }

                var now = new Date().getTime();
                if(now - start > ms) {
                    return cb(null, false);
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
