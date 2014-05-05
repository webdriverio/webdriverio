/**
 *
 * Get the title of current opened website.
 *
 * @returns {String} current page title
 * @uses protocol/title
 *
 */

var async = require('async');

module.exports = function getTitle () {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1],
        self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.title(cb);
        },
        function(res, cb) {
            response.title = res;
            cb();
        }
    ], function(err) {

        callback(err, response.title.value, response);

    });

};