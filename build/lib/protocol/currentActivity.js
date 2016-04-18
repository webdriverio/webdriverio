/**
 *
 * Receive the current activity on an Android device.
 *
 * <example>
    :rotateAsync.js
    browser.currentActivity().then(function() {
        console.log(activity); // returns android activity information
    });
 * </example>
 *
 * @see https://github.com/appium/appium-android-driver/blob/master/lib/commands/general.js#L59-L61
 * @type mobile
 * @for android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var currentActivity = function currentActivity() {
    return this.requestHandler.create('/session/:sessionId/appium/device/current_activity');
};

exports['default'] = currentActivity;
module.exports = exports['default'];
