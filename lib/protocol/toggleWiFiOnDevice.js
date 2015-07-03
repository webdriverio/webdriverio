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

    var requestOptions = {
        path: '/session/:sessionId/appium/device/toggle_wifi',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);

};