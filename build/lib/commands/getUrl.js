/**
 *
 * Get the url of current opened website.
 *
 * <example>
    :getUrlAsync.js
    client
        .url('http://webdriver.io')
        .getUrl().then(function(url) {
            console.log(url);
            // outputs the following:
            // "http://webdriver.io"
        });
 * </example>
 *
 * @returns {String} current page url
 * @uses protocol/url
 * @type property
 *
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});
var getUrl = function getUrl() {
    return this.unify(this.url(), {
        extractValue: true
    });
};

exports["default"] = getUrl;
module.exports = exports["default"];
