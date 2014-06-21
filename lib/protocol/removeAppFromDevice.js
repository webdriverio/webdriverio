/**
 *
 * remove an app from the device
 *
 * @param {String} bundleId  bundle ID of application
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#remove-app
 * @type appium
 *
 */

module.exports = function removeAppFromDevice(appId) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/remove_app',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, { appId: appId }, callback);

};