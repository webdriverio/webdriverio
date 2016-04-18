/**
 *
 * Press a particular key code on the device.
 *
 * <example>
    :longPressKeycodeSync.js
    // press the home button long
    browser.longPressKeycode(3)
 * </example>
 *
 * @param {String} keycode    key code to press
 * @param {String} metastate  meta state to be activated
 *
 * @see http://developer.android.com/reference/android/view/KeyEvent.html
 * @type mobile
 * @for android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var longPressKeycode = function longPressKeycode(keycode, metastate) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/long_press_keycode',
        method: 'POST'
    }, { keycode: keycode, metastate: metastate });
};

exports['default'] = longPressKeycode;
module.exports = exports['default'];
