/**
 *
 * Protocol binding to load or get the URL of the browser.
 *
 * <example>
    :url.js
    // Retrieve the URL of the current page.
    client.url().then(function(res) { ... });

    // navigate to a new URL
    client.url('http://webdriver.io');
 * </example>
 *
 * @param {String=} url  the URL to navigate to
 * @returns {String}     the current URL
 *
 * @see  https://code.google.com/p/selenium/wiki/JsonWireProtocol#/session/:sessionId/url
 * @type protocol
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var url = function url(uri) {
    var data = {};

    if (typeof uri === 'string') {
        data.url = uri;

        if (typeof this.options.baseUrl === 'string' && data.url.indexOf('/') === 0) {
            data.url = this.options.baseUrl + data.url;
        }
    }

    return this.requestHandler.create('/session/:sessionId/url', data);
};

exports['default'] = url;
module.exports = exports['default'];
