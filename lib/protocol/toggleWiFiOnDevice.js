/**
 *
 * Toggle WiFi on device.
 *
 * <example>
    :toggleWiFiOnDevice.js
    client.toggleWiFiOnDevice()
 * </example>
 *
 * @type appium
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