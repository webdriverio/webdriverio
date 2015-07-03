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
 * @type appium
 *
 */

module.exports = function installAppOnDevice(appPath) {

    var requestOptions = {
        path: '/session/:sessionId/appium/device/install_app',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions, { appPath: appPath });

};