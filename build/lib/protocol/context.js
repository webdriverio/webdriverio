/**
 *
 * Retrieve current context or switch to the specified context
 *
 * @param {String=} id the context to switch to
 *
 * @see http://appium.io/slate/en/v1.1.0/?javascript#automating-hybrid-ios-apps, https://github.com/admc/wd/blob/master/lib/commands.js#L279
 * @type mobile
 * @for android, ios
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var context = function context(id) {
    var requestOptions = {
        path: '/session/:sessionId/context',
        method: 'GET'
    };

    var data = {};

    if (typeof id === 'string') {
        requestOptions.method = 'POST';
        data.name = id;
    }

    return this.requestHandler.create(requestOptions, data);
};

exports['default'] = context;
module.exports = exports['default'];
