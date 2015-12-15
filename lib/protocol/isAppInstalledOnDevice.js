/**
 *
 * Check if an app is installed.
 *
 * <example>
    :isAppInstalledOnDevice.js
    client.isAppInstalledOnDevice(bundleId);
 * </example>
 *
 * @param {String} bundleId  ID of bundled app
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#is-installed
 * @type mobile
 * @for android
 *
 */

let isAppInstalledOnDevice = function (bundleId) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/app_installed',
        method: 'POST'
    }, {
        bundleId: bundleId
    })
}

export default isAppInstalledOnDevice
