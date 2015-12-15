/**
 *
 * Install an app on device.
 *
 * <example>
    :installAppOnDevice.js
    client.installAppOnDevice('/path/to/my/App.app');
 * </example>
 *
 * @param {String} path  path to Android/iOS application
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#install-app
 * @type mobile
 * @for android
 *
 */

let installAppOnDevice = function (appPath) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/install_app',
        method: 'POST'
    }, {
        appPath: appPath
    })
}

export default installAppOnDevice
