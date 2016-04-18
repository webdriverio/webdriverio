/**
 *
 * Remove an app from the device.
 *
 * <example>
    :removeAppSync.js
    browser.removeApp('com.example.android.apis');
 * </example>
 *
 * @param {String} bundleId  bundle ID of application
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#remove-app
 * @type mobile
 * @for android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var removeApp = function removeApp(bundleId) {
    if (typeof appPath !== 'string') {
        throw new _utilsErrorHandler.ProtocolError('removeApp command requires bundleId parameter from type string');
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/remove_app',
        method: 'POST'
    }, { bundleId: bundleId });
};

exports['default'] = removeApp;
module.exports = exports['default'];
