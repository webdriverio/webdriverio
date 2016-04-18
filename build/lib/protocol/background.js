/**
 *
 * Send the currently active app to the background.
 *
 * <example>
    :backgroundApp.js
    client.background(1);
 * </example>
 *
 * @param {Number} seconds  number of seconds after the app gets send to background
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#background-app
 * @type mobile
 * @for android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var background = function background() {
    var seconds = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/background',
        method: 'POST'
    }, { seconds: seconds });
};

exports['default'] = background;
module.exports = exports['default'];
