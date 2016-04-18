/**
 *
 * Open the notifications pane on the device.
 *
 * <example>
    :openNotificationsSync.js
    browser.openNotifications();
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var openNotifications = function openNotifications() {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/open_notifications',
        method: 'POST'
    });
};

exports['default'] = openNotifications;
module.exports = exports['default'];
