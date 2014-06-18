/**
 *
 * Retrieve a list of all window handles available in the session.
 *
 * @returns {String[]} a list of window handles
 * @uses protocol/windowHandles
 * @type window
 *
 */

var async = require('async');

module.exports = function getTabIds () {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1],
        self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.windowHandles(cb);
        },
        function(res, cb) {
            response.windowHandles = res;
            cb();
        }
    ], function(err) {

        var value = response.windowHandles && response.windowHandles.value;

        callback(err, value, response);

    });

};