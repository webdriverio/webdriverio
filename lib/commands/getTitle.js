/**
 *
 * Get the title of current opened website.
 *
 * <example>
    :getTitle.js
    client
        .url('http://webdriver.io')
        .getTitle(function(err, title) {
            console.log(title);
            // outputs the following:
            // "WebdriverIO - Selenium 2.0 javascript bindings for nodejs"
        });
 * </example>
 *
 * @returns {String} current page title
 * @uses protocol/title
 * @type property
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