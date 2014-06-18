/**
 *
 * Delete a cookie with the given name for current page.
 *
 * @param {String} name name of cookie
 * @uses protocol/cookie
 * @type cookie
 *
 */

var async = require('async');

module.exports = function deleteCookie (name) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof name !== 'string') {
        name = null;
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.cookie('DELETE', name, cb);
        },
        function(res, cb) {
            response.cookie = res;
            cb();
        }
    ], function(err) {

        callback(err, null, response);

    });

};