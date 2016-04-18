/**
 *
 * Check if an app is installed.
 *
 * <example>
    :isAppInstalledSync.js
    browser.isAppInstalled('com.example.android.apis');
 * </example>
 *
 * @param {String} bundleId  ID of bundled app
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#is-installed
 * @type mobile
 * @for android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var isAppInstalled = function isAppInstalled(bundleId) {
    if (typeof appPath !== 'string') {
        throw new _utilsErrorHandler.ProtocolError('isAppInstalled command requires bundleId parameter from type string');
    }

    return this.unify(this.requestHandler.create({
        path: '/session/:sessionId/appium/device/app_installed',
        method: 'POST'
    }, { bundleId: bundleId }));
};

exports['default'] = isAppInstalled;
module.exports = exports['default'];
