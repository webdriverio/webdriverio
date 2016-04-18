/**
 *
 * Get current device activity.
 *
 * <example>
    :getCurrentDeviceActivityAsync.js
    browser.getCurrentDeviceActivity().then(function(activity) {
        console.log(activity); // returns ".MainActivity"
    })
 * </example>
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#current-activity
 * @type mobile
 * @for android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var getCurrentDeviceActivity = function getCurrentDeviceActivity() {
    return this.unify(this.requestHandler.create({
        path: '/session/:sessionId/appium/device/current_activity',
        method: 'GET'
    }), {
        extractValue: true
    });
};

exports['default'] = getCurrentDeviceActivity;
module.exports = exports['default'];
