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
 * @type appium
 *
 */

module.exports = function isAppInstalledOnDevice(bundleId) {

    var requestOptions = {
        path: '/session/:sessionId/appium/device/app_installed',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions, { bundleId: bundleId });

};