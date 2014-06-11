/**
 *
 * check if app is installed (Appium specific command)
 *
 * ### Usage:
 *
 *     client.isAppInstalledOnDevice(bundleId)
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