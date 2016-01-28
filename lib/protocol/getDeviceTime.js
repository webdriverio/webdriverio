/**
 *
 * Captures iOS device date and time (command works only for real devices).
 *
 * @see https://github.com/appium/appium-ios-driver/blob/master/lib/commands/general.js#L19-L35
 * @type mobile
 * @for ios
 *
 */

let getDeviceTime = function () {
    return this.requestHandler.create('/session/:sessionId/appium/device/system_time')
}

export default getDeviceTime
