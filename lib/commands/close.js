/**
 *
 * Close current window (and focus on an other window).
 *
 * @param {String=} windowHandle new window to focus on
 *
 * @uses protocol/window, window/switchTab
 * @type window
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function close (windowHandle) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof windowHandle === 'function') {
        callback = windowHandle;
        windowHandle = null;
    } else if(typeof windowHandle !== 'string') {
        return callback(new ErrorHandler.CommandError('number or type of arguments don\'t agree with close command'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.window(cb);
        },
        function(res,cb) {
            response.window = response;
            self.switchTab(windowHandle, cb);
        },
        function(val, res, cb) {
            response.switchTab = res;
            cb();
        }
    ], function(err) {

        callback(err, null, response);

    });

};