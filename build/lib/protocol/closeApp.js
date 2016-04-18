/**
 *
 * Close the given application.
 *
 * <example>
    :closeApp.js
    browser.closeApp()
 * </example>
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#close-app
 * @type mobile
 * @for ios
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var closeApp = function closeApp() {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/close',
        method: 'POST'
    });
};

exports['default'] = closeApp;
module.exports = exports['default'];
