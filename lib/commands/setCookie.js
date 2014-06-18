/**
 *
 * Sets a [cookie](https://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object)
 * for current page.
 *
 * ### Usage
 *
 *     client.setCookie({
 *         name: 'myCookie',
 *         value: 'some content'
 *     });
 *
 * @param {Object} cookie cookie object
 * @uses protocol/cookie
 * @type cookie
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function setCookie (cookieObj) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    /*!
     * parameter check
     */
    if(typeof cookieObj !== 'object') {
        return callback(new ErrorHandler.CommandError('Please specify a cookie object to set (see http://code.google.com/p/selenium/wiki/JsonWireProtocol#Cookie_JSON_Object for documentation.'));
    }

    var self = this,
        response = {};

    async.waterfall([
        function(cb) {
            self.cookie('POST', cookieObj, cb);
        },
        function(res, cb) {
            response.cookie = res;
            cb();
        }
    ], function(err) {

        callback(err,null,response);

    });

};