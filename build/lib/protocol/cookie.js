/**
 * Protocol binding to operate with cookies on the current page.
 *
 * <example>
    :cookie.js
    // get all cookies
    client.cookie().then(function(res) { ... });

    // set cookie (sync)
    browser.cookie('post', {
        name: 'myCookie',
        value: 'some content'
    });

    // delete cookie (sync)
    client.cookie('delete','myCookie');
 * </example>
 *
 * @param {String=}         method  request method
 * @param {Object=|String=} args    contains cookie information if you want to set a cookie or contains name of cookie if you want to delete it
 *
 * @returns {Object}  cookie data
 *
 * @see  http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/cookie
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/cookie/:name
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var cookie = function cookie(method, args) {
    if (method === undefined) method = 'GET';

    var data = {};
    var requestOptions = {
        path: '/session/:sessionId/cookie',
        method: method
    };

    /**
     * set cookie param for POST method
     */
    if (method.toUpperCase() === 'POST' && typeof args === 'object') {
        data.cookie = args;
    }

    /**
     * add cookie name tp path URL to delete a specific cookie object
     */
    if (method.toUpperCase() === 'DELETE' && typeof args === 'string') {
        requestOptions.path += '/' + args;
    }

    return this.requestHandler.create(requestOptions, data);
};

exports['default'] = cookie;
module.exports = exports['default'];
