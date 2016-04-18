/**
 *
 * send a key event to the device
 *
 * @param {Number} keyValue  device specifc key value
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#key-event
 * @type mobile
 * @for android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var deviceKeyEvent = function deviceKeyEvent(keycode, metastate) {
    var data = {
        keycode: keycode
    };

    if (metastate) {
        data.metastate = metastate;
    }

    var requestOptions = {
        path: '/session/:sessionId/appium/device/keyevent',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions, data);
};

exports['default'] = deviceKeyEvent;
module.exports = exports['default'];
