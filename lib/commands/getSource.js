/**
 *
 * Get source code of the page.
 *
 * @returns {String} source code of current website
 * @uses protocol/source
 *
 */

var async = require('async');

module.exports = function getSource () {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1],
        self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.source(cb);
        },
        function(res, cb) {
            response.source = res;
            cb();
        }
    ], function(err) {

        var value = response.source && response.source.value;

        callback(err, value, response);

    });

};