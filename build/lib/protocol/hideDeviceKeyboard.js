/**
 *
 * Hide the keyboard.
 *
 * <example>
    :hideKeyboardDefaultSync.js
    browser.hideDeviceKeyboard() // taps outside to hide keyboard

    :hideKeyboardWithTapSync.js
    browser.hideDeviceKeyboard('tapOutside')

    :hideKeyboardDoneSync.js
    browser.hideDeviceKeyboard('pressKey', 'Done')
 * </example>
 *
 * @param {String} strategy  desired strategy to close keyboard ('tapOutside' or 'pressKey')
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#hide-keyboard-ios-only
 * @type mobile
 * @for ios, android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var hideDeviceKeyboard = function hideDeviceKeyboard(strategy, key) {
    if (strategy === undefined) strategy = 'tapOutside';

    var args = { strategy: strategy };

    if (key) {
        args.key = key;
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/hide_keyboard',
        method: 'POST'
    }, args);
};

exports['default'] = hideDeviceKeyboard;
module.exports = exports['default'];
