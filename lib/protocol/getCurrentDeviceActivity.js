/**
 *
 * get current device activity (Android only)
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#current-activity
 * @type appium
 *
 */

let getCurrentDeviceActivity = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/current_activity',
        method: 'GET'
    })
}

export default getCurrentDeviceActivity
