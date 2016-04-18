/**
 *
 * Press a particular key code on the device.
 *
 * <example>
    :pressKeycodeSync.js
    // press the home button
    browser.pressKeycode(3)
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
var pressKeycode = function pressKeycode(keycode, metastate) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/press_keycode',
        method: 'POST'
    }, { keycode: keycode, metastate: metastate });
};

exports['default'] = pressKeycode;
module.exports = exports['default'];
