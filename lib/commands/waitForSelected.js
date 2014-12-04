/**
 *
 * Wait for an element (selected by css selector) for the provided amount of
 * milliseconds to be (un)selected. If multiple elements get queryied by given
 * selector, it returns true (or false if reverse flag is set) if at least one
 * element is (un)selected.
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
    isSelectedFunc = require('../helpers/_isSelected'),
    ErrorHandler = require('../utils/ErrorHandler');

module.exports = function waitForSelected(selector, ms, reverse) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if (typeof selector !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with waitForSelected command'));
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
        response = {};

    async.waterfall([
        function(cb) {
            self.timeoutsAsyncScript(ms, cb);
        },
        function(res, cb) {
            response.timeoutsAsyncScript = res;
            self.selectorExecuteAsync(selector, isSelectedFunc, reverse, cb);
        },
        function(result, res, cb) {
            response.selectorExecuteAsync = res;
            cb();
        }
    ], function(err) {

        callback(err, response.selectorExecuteAsync && response.selectorExecuteAsync.executeAsync ? response.selectorExecuteAsync.executeAsync.value : false, response);

    });

};