/**
 *
 * Switch the state (enabled/disabled) of airplane mode.
 *
 * <example>
    :toggleAirplaneMode.js
    browser.toggleAirplaneMode()
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
var toggleAirplaneMode = function toggleAirplaneMode() {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/toggle_airplane_mode',
        method: 'POST'
    });
};

exports['default'] = toggleAirplaneMode;
module.exports = exports['default'];
