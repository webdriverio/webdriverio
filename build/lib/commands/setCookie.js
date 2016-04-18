/**
 *
 * Sets a [cookie](https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#cookie-json-object)
 * for current page.
 *
 * <example>
    :getCookieAsync.js
    client
        .setCookie({name: 'test', value: '123'})
        .getCookie().then(function(cookies) {
            console.log(cookies); // outputs: [{ name: 'test', value: '123' }]
        })
 * </example>
 *
 * @param {Object} cookie cookie object
 *
 * @uses protocol/cookie
 * @type cookie
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var setCookie = function setCookie(cookieObj) {
    /*!
     * parameter check
     */
    if (typeof cookieObj !== 'object') {
        throw new _utilsErrorHandler.CommandError('Please specify a cookie object to set (see https://github.com/SeleniumHQ/selenium/wiki/JsonWireProtocol#cookie-json-object for documentation.');
    }

    return this.cookie('POST', cookieObj);
};

exports['default'] = setCookie;
module.exports = exports['default'];
