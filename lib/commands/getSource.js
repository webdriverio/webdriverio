/**
 *
 * Get source code of the page.
 *
 * <example>
    :getSource.js
    client
        .url('http://webdriver.io')
        .getSource(function(err, source) {
            console.log(source); // outputs: "<!DOCTYPE html>\n<title>Webdriver.io</title>..."
        });
 * </example>
 *
 * @returns {String} source code of current website
 * @uses protocol/source
 * @type property
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