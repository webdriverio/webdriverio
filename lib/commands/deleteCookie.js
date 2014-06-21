/**
 *
 * Delete cookies visible to the current page. By providing a cookie name it just removes the single cookie.
 *
 * <example>
    :deleteSingleCookie.js
    client
        .setCookie({name: 'test', value: '123'})
        .getCookie(function(err, cookies) {
            console.log(cookies); // outputs: [{ name: 'test', value: '123' }]
        })
        .deleteCookie('test')
        .getCookie(function(err, cookies) {
            console.log(cookies); // outputs: []
        })

    :deleteMultipleCookies.js
    client
        .setCookie({name: 'test', value: '123'})
        .setCookie({name: 'test2', value: '456'})
        .getCookie(function(err, cookies) {
            console.log(cookies);
            // outputs:
            // [
            //     { name: 'test', value: '123' },
            //     { name: 'test2', value: '456' }
            // ]
        })
        .deleteCookie()
        .getCookie(function(err, cookies) {
            console.log(cookies); // outputs: []
        })
 * </example>
 *
 * @param {String=} name name of cookie to be deleted
 *
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