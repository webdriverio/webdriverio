/**
 *
 * Switch the state (enabled/disabled) of the wifi service.
 *
 * <example>
    :toggleWiFi.js
    client.toggleWiFi()
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
var toggleWiFi = function toggleWiFi() {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/toggle_wifi',
        method: 'POST'
    });
};

exports['default'] = toggleWiFi;
module.exports = exports['default'];
