/**
 * Protocol binding to operate with cookies on the current page.
 *
 * @param {String=}         method  request method
 * @param {Object=|String=} args    contains cookie information if you want to set a cookie or contains name of cookie if you want to delete it
 *
 * @returns {Object}  cookie data if method === GET
 *
 * @see  http://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/cookie
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/cookie/:name
 *
 * @test cookie.js test/spec/desktop/cookie/index.js
 * @test index.html test/spec/desktop/cookie/index.html
 *
 */

module.exports = function cookie (method, args) {

    // set default options
    var data = {},
        requestOptions = {
            path: '/session/:sessionId/cookie',
            method: typeof method === 'string' ? method : 'GET'
        };


    // set cookie param for POST method
    if(method === 'POST' && typeof args === 'object') {
        data.cookie = args;
    }

    // add cookie name tp path URL to delete a specific cookie object
    if(method === 'DELETE' && typeof args === 'string') {
        requestOptions.path += '/' + args;
    }

    // create request
    this.requestHandler.create(requestOptions,data,arguments[arguments.length - 1]);

};