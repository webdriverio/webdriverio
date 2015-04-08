/**
 *
 * remove an app from the device
 *
 * @param {String} bundleId  bundle ID of application
 * @callbackParameter error, response
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#remove-app
 * @type appium
 *
 */

module.exports = function removeAppFromDevice(appId) {

    var requestOptions = {
        path: '/session/:sessionId/appium/device/remove_app',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions, { appId: appId });

};