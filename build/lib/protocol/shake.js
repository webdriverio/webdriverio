/**
 *
 * Perform a shake action on the device.
 *
 * <example>
    :shakeItSync.js
    browser.shake()
 * </example>
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#shake
 * @type mobile
 * @for ios
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var shake = function shake() {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/shake',
        method: 'POST'
    });
};

exports['default'] = shake;
module.exports = exports['default'];
