/**
 *
 * Retrieve the current window handle.
 *
 * @returns {String} the window handle URL of the current focused window
 * @uses protocol/windowHandle
 * @type window
 *
 */

var async = require('async');

module.exports = function getCurrentTabId () {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1],
        self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.windowHandle(cb);
        },
        function(res, cb) {
            response.windowHandle = res;
            cb();
        }
    ], function(err) {

        callback(err, response.windowHandle.value, response);

    });

};