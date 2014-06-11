/**
 *
 * toggle WiFi on device (Appium specific command)
 *
 * ### Usage:
 *
 *     client.toggleWiFiOnDevice()
 *
 */

module.exports = function toggleWiFiOnDevice() {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/toggle_wifi',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, callback);

};