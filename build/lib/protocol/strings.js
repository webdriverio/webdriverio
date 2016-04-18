/**
 *
 * Returns application strings of the application in a specific language.
 *
 * <example>
    :stringsAsync.js
    browser.strings().then(function(appStrings) {
        console.log(appStrings); // outputs all app strings
    });

    :stringsRu.js
    browser.strings('ru').then(function(appStrings) {
        console.log(appStrings); // outputs all russian app strings (if available)
    });
 * </example>
 *
 * @see https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#app-strings
 * @type mobile
 * @for android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var strings = function strings(language) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/strings',
        method: 'POST'
    }, { language: language });
};

exports['default'] = strings;
module.exports = exports['default'];
