/**
 *
 * Captures iOS device date and time (command works only for real devices).
 *
 * @see https://github.com/appium/appium-ios-driver/blob/master/lib/commands/general.js#L19-L35
 * @type mobile
 * @for ios
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
var getDeviceTime = function getDeviceTime() {
  return this.requestHandler.create('/session/:sessionId/appium/device/system_time');
};

exports['default'] = getDeviceTime;
module.exports = exports['default'];
