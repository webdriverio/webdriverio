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

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/app_installed',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, { bundleId: bundleId }, callback);

};