/**
 *
 * Install an app on device.
 *
 * <example>
    :installAppSync.js
    browser.installApp('/path/to/my/App.app');
 * </example>
 *
 * @param {String} path  path to Android application
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#install-app
 * @type mobile
 * @for android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var installApp = function installApp(appPath) {
    if (typeof appPath !== 'string') {
        throw new _utilsErrorHandler.ProtocolError('installApp command requires appPath parameter from type string');
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/install_app',
        method: 'POST'
    }, { appPath: appPath });
};

exports['default'] = installApp;
module.exports = exports['default'];
