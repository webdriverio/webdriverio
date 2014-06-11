/**
 *
 * install app on device (Appium specific command)
 *
 * ### Usage:
 *
 *     client.removeAppFromDevice(appId)
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