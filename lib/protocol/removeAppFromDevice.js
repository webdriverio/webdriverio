/**
 *
 * remove an app from the device
 *
 * @param {String} bundleId  bundle ID of application
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#remove-app
 * @type mobile
 * @for android
 *
 */

let removeAppFromDevice = function (appId) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/remove_app',
        method: 'POST'
    }, {
        appId: appId
    })
}

export default removeAppFromDevice
