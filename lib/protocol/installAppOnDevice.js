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

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/install_app',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, { appPath: appPath }, callback);

};